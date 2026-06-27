import { SessionState, Question, QueueItem, DoneStat, SavedSessionMetadata } from '../models/types';
import { shuffle, shuffleIndices } from './shuffle';
import { deleteSessionImages } from './db';

const SESSIONS_STORAGE_KEY = 'testownik_sessions_v2';
const CURRENT_SESSION_ID_KEY = 'testownik_current_session_id';
const SCHEMA_VERSION = 1;

export function buildInitialSession(
  questions: Question[],
  repeatMode: number,
  baseName: string = 'Baza pytań'
): SessionState {
  const shuffled = shuffle([...questions]);

  // When repeatMode > 1, ALL questions start with the higher streak requirement,
  // not just questions that were previously answered wrong.
  const initialStreak = repeatMode > 1 ? repeatMode : 1;

  const queue: QueueItem[] = shuffled.map(q => ({
    questionId: q.id,
    requiredCorrectStreak: initialStreak,
    consecutiveCorrect: 0,
    wrongCount: 0,
    firstAnswerWrong: false,
  }));

  const firstQ = questions.find(q => q.id === queue[0]?.questionId);

  return {
    version: SCHEMA_VERSION,
    questions,
    queue,
    done: [],
    doneStats: [],
    repeatMode,
    elapsedSeconds: 0,
    totalFirstAttempts: 0,
    totalFirstCorrect: 0,
    startedAt: new Date().toISOString(),
    phase: 'test',
    currentQuestionIndex: 0,
    shuffledAnswerOrder: shuffleIndices(firstQ?.answers.length ?? 4),
    baseName,
  };
}

export function getQuestionForQueueItem(
  questions: Question[],
  item: QueueItem | undefined
): Question | undefined {
  if (!item) return undefined;
  return questions.find(q => q.id === item.questionId);
}

export function processCorrectAnswer(session: SessionState): SessionState {
  const s = { ...session };
  const queue = [...s.queue];
  const item = { ...queue[s.currentQuestionIndex] };

  if (item.consecutiveCorrect === 0 && item.wrongCount === 0) {
    s.totalFirstAttempts += 1;
    s.totalFirstCorrect += 1;
  }

  item.consecutiveCorrect += 1;

  if (item.consecutiveCorrect >= item.requiredCorrectStreak) {
    const stat: DoneStat = {
      questionId: item.questionId,
      wrongCount: item.wrongCount,
      firstAnswerWrong: item.firstAnswerWrong,
    };
    queue.splice(s.currentQuestionIndex, 1);
    s.done = [...s.done, item.questionId];
    s.doneStats = [...s.doneStats, stat];

    if (queue.length === 0) {
      s.queue = queue;
      s.phase = 'summary';
      return s;
    }

    const nextIndex = s.currentQuestionIndex % queue.length;
    s.currentQuestionIndex = nextIndex;
  } else {
    queue.splice(s.currentQuestionIndex, 1);

    const minGap = Math.min(3, queue.length);
    const insertMin = s.currentQuestionIndex + minGap;
    const insertMax = queue.length;
    const insertAt = insertMin >= insertMax
      ? queue.length
      : Math.floor(Math.random() * (insertMax - insertMin + 1)) + insertMin;
    queue.splice(insertAt, 0, item);

    s.currentQuestionIndex = s.currentQuestionIndex % queue.length;
  }

  const nextQ = getQuestionForQueueItem(s.questions, queue[s.currentQuestionIndex]);
  s.shuffledAnswerOrder = nextQ ? shuffleIndices(nextQ.answers.length) : [];
  s.queue = queue;
  return s;
}

export function processWrongAnswer(session: SessionState): SessionState {
  const s = { ...session };
  const queue = [...s.queue];
  const item = { ...queue[s.currentQuestionIndex] };

  if (item.consecutiveCorrect === 0 && item.wrongCount === 0) {
    s.totalFirstAttempts += 1;
    item.firstAnswerWrong = true;
    item.consecutiveCorrect = 0;
  }

  item.wrongCount += 1;
  item.consecutiveCorrect = 0;
  item.requiredCorrectStreak = s.repeatMode;

  queue.splice(s.currentQuestionIndex, 1);

  // Ensures at least a few questions before it appears again
  const minGap = Math.min(3, queue.length);
  const insertMin = s.currentQuestionIndex + minGap;
  const insertMax = queue.length;
  const insertAt = insertMin >= insertMax
    ? queue.length
    : Math.floor(Math.random() * (insertMax - insertMin + 1)) + insertMin;
  queue.splice(insertAt, 0, item);

  const nextIndex = s.currentQuestionIndex % queue.length;
  s.currentQuestionIndex = nextIndex;

  const nextQ = getQuestionForQueueItem(s.questions, queue[nextIndex]);
  s.shuffledAnswerOrder = nextQ ? shuffleIndices(nextQ.answers.length) : [];
  s.queue = queue;
  return s;
}

export function getHardestQuestions(
  session: SessionState,
  limit = 10
): Array<{ question: Question; wrongCount: number }> {
  const allStats: DoneStat[] = [
    ...session.doneStats,
    // Items still in queue at summary time (shouldn't happen but defensive)
    ...session.queue.map(item => ({
      questionId: item.questionId,
      wrongCount: item.wrongCount,
      firstAnswerWrong: item.firstAnswerWrong,
    })),
  ];

  return allStats
    .filter(stat => stat.wrongCount > 0)
    .sort((a, b) => b.wrongCount - a.wrongCount)
    .slice(0, limit)
    .map(stat => ({
      question: session.questions.find(q => q.id === stat.questionId)!,
      wrongCount: stat.wrongCount,
    }))
    .filter(entry => !!entry.question);
}

function generateSessionId(): string {
  return Date.now().toString(36);
}

export function saveSession(session: SessionState, sessionId?: string): string {
  try {
    const id = sessionId || generateSessionId();
    const sessions = loadAllSessions();
    sessions[id] = session;
    const serialized = JSON.stringify(sessions);
    localStorage.setItem(SESSIONS_STORAGE_KEY, serialized);
    invalidateSessionsCache();
    localStorage.setItem(CURRENT_SESSION_ID_KEY, id);
    return id;
  } catch (err) {
    console.warn('Could not save session:', err);
    return '';
  }
}

export function loadSession(sessionId?: string): SessionState | null {
  try {
    const id = sessionId || localStorage.getItem(CURRENT_SESSION_ID_KEY);
    if (!id) return null;
    
    const sessions = loadAllSessions();
    const session = sessions[id];
    if (!session) return null;
    
    if (session.version !== SCHEMA_VERSION) return null;
    return session;
  } catch {
    return null;
  }
}

let _sessionsCache: Record<string, SessionState> | null = null;
let _sessionsCacheRaw: string | null = null;

function loadAllSessions(): Record<string, SessionState> {
  try {
    const raw = localStorage.getItem(SESSIONS_STORAGE_KEY);
    if (!raw) return {};
    if (raw === _sessionsCacheRaw && _sessionsCache) return _sessionsCache;
    _sessionsCache = JSON.parse(raw) as Record<string, SessionState>;
    _sessionsCacheRaw = raw;
    return _sessionsCache;
  } catch {
    return {};
  }
}

function invalidateSessionsCache(): void {
  _sessionsCache = null;
  _sessionsCacheRaw = null;
}

export function deleteSession(sessionId: string): void {
  try {
    const sessions = loadAllSessions();
    delete sessions[sessionId];
    const serialized = JSON.stringify(sessions);
    localStorage.setItem(SESSIONS_STORAGE_KEY, serialized);
    invalidateSessionsCache();
    
    deleteSessionImages(sessionId).catch(err => console.warn('Failed to delete images:', err));

    const currentId = localStorage.getItem(CURRENT_SESSION_ID_KEY);
    if (currentId === sessionId) {
      localStorage.removeItem(CURRENT_SESSION_ID_KEY);
    }
  } catch (err) {
    console.warn('Could not delete session:', err);
  }
}

export function getAllSessionMetadata(): SavedSessionMetadata[] {
  try {
    const sessions = loadAllSessions();
    return Object.entries(sessions)
      .map(([id, session]) => ({
        id,
        baseName: session.baseName || 'Baza pytań',
        createdAt: session.startedAt,
        totalQuestions: session.questions.length,
        completedQuestions: session.done.length,
        currentPhase: session.phase as 'test' | 'summary',
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch {
    return [];
  }
}

export function renameSession(sessionId: string, newBaseName: string): void {
  try {
    const sessions = loadAllSessions();
    if (sessions[sessionId]) {
      sessions[sessionId] = { ...sessions[sessionId], baseName: newBaseName };
      const serialized = JSON.stringify(sessions);
      localStorage.setItem(SESSIONS_STORAGE_KEY, serialized);
      invalidateSessionsCache();
    }
  } catch (err) {
    console.warn('Could not rename session:', err);
  }
}

export function getCurrentSessionId(): string | null {
  return localStorage.getItem(CURRENT_SESSION_ID_KEY);
}

export function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const sec = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(sec)}`;
}
