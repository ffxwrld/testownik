import { get, set, del } from 'idb-keyval';
import { SessionState, Question, QueueItem, DoneStat, SavedSessionMetadata, ChunkInfo } from '../models/types';
import { shuffle, shuffleIndices } from './shuffle';
import { deleteSessionImages } from './db';

const SESSIONS_STORAGE_KEY = 'testownik_sessions_v2';
const SESSIONS_IDB_KEY = 'testownik_sessions_db';
const SESSIONS_META_IDB_KEY = 'testownik_sessions_meta_v1';
const SESSION_PREFIX = 'testownik_session_';
const CURRENT_SESSION_ID_KEY = 'testownik_current_session_id';
const SCHEMA_VERSION = 1;

const _sessionCache = new Map<string, SessionState>();
let _metaCache: SavedSessionMetadata[] | null = null;
let _idbMigrated = false;

function extractMetadata(id: string, session: SessionState): SavedSessionMetadata {
  return {
    id,
    baseName: session.baseName || 'Baza pytań',
    createdAt: session.startedAt,
    updatedAt: session.updatedAt || session.startedAt,
    totalQuestions: session.questions?.length ?? 0,
    completedQuestions: session.done?.length ?? 0,
    currentPhase: (session.phase as 'test' | 'summary') || 'test',
    targetDate: session.targetDate,
    chunkConfig: session.chunkConfig,
  };
}

export function _resetSessionStorageForTesting(): void {
  _sessionCache.clear();
  _metaCache = null;
  _idbMigrated = false;
}

export function buildInitialSession(
  questions: Question[],
  repeatMode: number,
  baseName: string = 'Baza pytań',
  targetDate?: string
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
    targetDate,
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
    if (!s.done.includes(item.questionId)) {
      s.done = [...s.done, item.questionId];
    }
    s.doneStats = [...s.doneStats, stat];

    if (queue.length === 0) {
      s.queue = queue;
      if (!s.chunkConfig?.enabled || s.chunkConfig.activeChunkIndex === null) {
        s.phase = 'summary';
      }
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

async function ensureMigrated(): Promise<void> {
  if (_idbMigrated) return;

  try {
    // 1. Check if metadata index already exists
    const existingMeta = await get<SavedSessionMetadata[]>(SESSIONS_META_IDB_KEY);
    if (existingMeta && Array.isArray(existingMeta)) {
      _metaCache = existingMeta;
      _idbMigrated = true;
      return;
    }

    // 2. Check legacy unified IDB key
    let oldSessions = await get<Record<string, SessionState>>(SESSIONS_IDB_KEY);

    // 3. Check legacy localStorage key
    if (!oldSessions) {
      const raw = localStorage.getItem(SESSIONS_STORAGE_KEY);
      if (raw) {
        try {
          oldSessions = JSON.parse(raw);
          localStorage.removeItem(SESSIONS_STORAGE_KEY);
        } catch (e) {
          console.error('Migration from localStorage failed:', e);
        }
      }
    }

    // 4. Migrate old sessions into individual IDB records + metadata index
    if (oldSessions && typeof oldSessions === 'object') {
      const metaList: SavedSessionMetadata[] = [];
      const promises: Promise<unknown>[] = [];

      for (const [id, session] of Object.entries(oldSessions)) {
        if (session && typeof session === 'object' && session.version === SCHEMA_VERSION) {
          const meta = extractMetadata(id, session);
          metaList.push(meta);
          _sessionCache.set(id, session);
          promises.push(set(`${SESSION_PREFIX}${id}`, session));
        }
      }

      metaList.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      _metaCache = metaList;
      promises.push(set(SESSIONS_META_IDB_KEY, metaList));
      promises.push(del(SESSIONS_IDB_KEY));
      await Promise.all(promises);
    } else {
      _metaCache = [];
      await set(SESSIONS_META_IDB_KEY, []);
    }

    _idbMigrated = true;
  } catch (err) {
    console.error('Session storage migration error:', err);
    _idbMigrated = true;
  }
}

export async function saveSession(session: SessionState, sessionId?: string): Promise<string> {
  try {
    await ensureMigrated();
    const id = sessionId || generateSessionId();
    session.updatedAt = new Date().toISOString();

    _sessionCache.set(id, session);
    await set(`${SESSION_PREFIX}${id}`, session);

    const meta = extractMetadata(id, session);
    const metaList = _metaCache ? [..._metaCache] : [];
    const existingIdx = metaList.findIndex(m => m.id === id);
    if (existingIdx >= 0) {
      metaList[existingIdx] = meta;
    } else {
      metaList.unshift(meta);
    }
    metaList.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    _metaCache = metaList;
    await set(SESSIONS_META_IDB_KEY, metaList);

    localStorage.setItem(CURRENT_SESSION_ID_KEY, id);
    return id;
  } catch (err) {
    console.warn('Could not save session:', err);
    return '';
  }
}

export async function loadSession(sessionId?: string): Promise<SessionState | null> {
  try {
    const id = sessionId || localStorage.getItem(CURRENT_SESSION_ID_KEY);
    if (!id) return null;

    if (_sessionCache.has(id)) {
      return _sessionCache.get(id)!;
    }

    await ensureMigrated();
    let session = await get<SessionState>(`${SESSION_PREFIX}${id}`);
    
    // Fallback check if migration hasn't converted this single session yet
    if (!session) {
      const oldSessions = await get<Record<string, SessionState>>(SESSIONS_IDB_KEY);
      if (oldSessions && oldSessions[id]) {
        session = oldSessions[id];
        await set(`${SESSION_PREFIX}${id}`, session);
      }
    }

    if (!session || session.version !== SCHEMA_VERSION) return null;
    _sessionCache.set(id, session);
    return session;
  } catch {
    return null;
  }
}

export async function loadAllSessions(): Promise<Record<string, SessionState>> {
  try {
    await ensureMigrated();
    const metadata = await getAllSessionMetadata();
    const result: Record<string, SessionState> = {};
    await Promise.all(
      metadata.map(async (meta) => {
        const session = await loadSession(meta.id);
        if (session) {
          result[meta.id] = session;
        }
      })
    );
    return result;
  } catch (err) {
    console.error('Failed to load sessions from IDB:', err);
    return {};
  }
}

export async function saveAllSessions(sessions: Record<string, SessionState>): Promise<void> {
  await ensureMigrated();
  const metaList: SavedSessionMetadata[] = [];
  const promises: Promise<unknown>[] = [];

  for (const [id, session] of Object.entries(sessions)) {
    if (session && typeof session === 'object') {
      _sessionCache.set(id, session);
      promises.push(set(`${SESSION_PREFIX}${id}`, session));
      metaList.push(extractMetadata(id, session));
    }
  }

  metaList.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  _metaCache = metaList;
  promises.push(set(SESSIONS_META_IDB_KEY, metaList));
  await Promise.all(promises);
}

export async function deleteSession(sessionId: string): Promise<void> {
  try {
    await ensureMigrated();
    _sessionCache.delete(sessionId);
    await del(`${SESSION_PREFIX}${sessionId}`);

    if (_metaCache) {
      _metaCache = _metaCache.filter(m => m.id !== sessionId);
      await set(SESSIONS_META_IDB_KEY, _metaCache);
    }

    deleteSessionImages(sessionId).catch(err => console.warn('Failed to delete images:', err));

    const currentId = localStorage.getItem(CURRENT_SESSION_ID_KEY);
    if (currentId === sessionId) {
      localStorage.removeItem(CURRENT_SESSION_ID_KEY);
    }
  } catch (err) {
    console.warn('Could not delete session:', err);
  }
}

/**
 * Saves a session to IDB without adding it to the metadata index.
 * Used for multiplayer guest sessions that should not appear in session lists.
 */
export async function saveSessionEphemeral(session: SessionState, sessionId: string): Promise<string> {
  try {
    await ensureMigrated();
    session.updatedAt = new Date().toISOString();
    _sessionCache.set(sessionId, session);
    await set(`${SESSION_PREFIX}${sessionId}`, session);
    return sessionId;
  } catch (err) {
    console.warn('Could not save ephemeral session:', err);
    return '';
  }
}

/**
 * Deletes an ephemeral session from IDB and cache.
 * Does not touch the metadata index (ephemeral sessions were never added there).
 */
export async function deleteEphemeralSession(sessionId: string): Promise<void> {
  try {
    _sessionCache.delete(sessionId);
    await del(`${SESSION_PREFIX}${sessionId}`);
    deleteSessionImages(sessionId).catch(err => console.warn('Failed to delete ephemeral images:', err));
  } catch (err) {
    console.warn('Could not delete ephemeral session:', err);
  }
}

export function getChunkList(totalQuestions: number, chunkSize: number): ChunkInfo[] {
  if (chunkSize <= 0 || totalQuestions <= 0) return [];
  const chunks: ChunkInfo[] = [];
  const numChunks = Math.ceil(totalQuestions / chunkSize);
  for (let i = 0; i < numChunks; i++) {
    const startIndex = i * chunkSize;
    const endIndex = Math.min(startIndex + chunkSize - 1, totalQuestions - 1);
    chunks.push({
      index: i,
      startIndex,
      endIndex,
      totalQuestions: endIndex - startIndex + 1,
    });
  }
  return chunks;
}

export function getChunkProgress(
  chunk: ChunkInfo,
  questions: Question[],
  doneIds: string[]
): { completed: number; total: number; percent: number } {
  const chunkQuestions = questions.slice(chunk.startIndex, chunk.endIndex + 1);
  const doneSet = new Set(doneIds);
  const completed = chunkQuestions.filter(q => doneSet.has(q.id)).length;
  const total = chunkQuestions.length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { completed, total, percent };
}

export function buildChunkQueue(
  questions: Question[],
  chunk: ChunkInfo,
  repeatMode: number,
  doneIds: string[]
): QueueItem[] {
  const doneSet = new Set(doneIds);
  const chunkQuestions = questions.slice(chunk.startIndex, chunk.endIndex + 1);
  const remainingQuestions = chunkQuestions.filter(q => !doneSet.has(q.id));
  const questionsToQueue = remainingQuestions.length > 0 ? remainingQuestions : chunkQuestions;

  const shuffled = shuffle([...questionsToQueue]);
  const initialStreak = repeatMode > 1 ? repeatMode : 1;

  return shuffled.map(q => ({
    questionId: q.id,
    requiredCorrectStreak: initialStreak,
    consecutiveCorrect: 0,
    wrongCount: 0,
    firstAnswerWrong: false,
  }));
}

export async function getAllSessionMetadata(): Promise<SavedSessionMetadata[]> {
  try {
    await ensureMigrated();
    if (_metaCache) return _metaCache;
    const meta = await get<SavedSessionMetadata[]>(SESSIONS_META_IDB_KEY);
    _metaCache = meta || [];
    return _metaCache;
  } catch {
    return [];
  }
}

export async function renameSession(sessionId: string, newBaseName: string): Promise<void> {
  try {
    const session = await loadSession(sessionId);
    if (session) {
      session.baseName = newBaseName;
      await saveSession(session, sessionId);
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
