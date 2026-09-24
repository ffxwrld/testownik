import { SessionState, Question, QueueItem, DoneStat } from '@/models/types';
import { shuffle, shuffleIndices } from '@/utils/shuffle';
import { SCHEMA_VERSION } from './constants';
import { prepareSpacedRepetitionQueue, calculateNextSpacedRepetition } from './spacedRepetition';

export function buildInitialSession(
  questions: Question[],
  repeatMode: number | 'spaced',
  baseName: string = 'Baza pytań',
  targetDate?: string
): SessionState {
  const shuffled = shuffle([...questions]);
  const initialStreak = (typeof repeatMode === 'number' && repeatMode > 1) ? repeatMode : 1;

  const queue: QueueItem[] = shuffled.map(q => ({
    questionId: q.id,
    requiredCorrectStreak: initialStreak,
    consecutiveCorrect: 0,
    wrongCount: 0,
    firstAnswerWrong: false,
  }));

  const firstQ = questions.find(q => q.id === queue[0]?.questionId);

  const session: SessionState = {
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
    srData: repeatMode === 'spaced' ? {} : undefined,
  };

  if (repeatMode === 'spaced') {
    return prepareSpacedRepetitionQueue(session);
  }

  return session;
}

export function getQuestionForQueueItem(
  questions: Question[],
  item: QueueItem | undefined
): Question | null {
  if (!item) return null;
  return questions.find(q => q.id === item.questionId) || null;
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

    if (s.repeatMode === 'spaced') {
      s.srData = {
        ...s.srData,
        [item.questionId]: calculateNextSpacedRepetition(s.srData?.[item.questionId], true)
      };
    }

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
    const spliceIndex = Math.min(queue.length, s.currentQuestionIndex + minGap);
    queue.splice(spliceIndex, 0, item);
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
  item.requiredCorrectStreak = typeof s.repeatMode === 'number' ? s.repeatMode : 1;

  if (s.repeatMode === 'spaced') {
    s.srData = {
      ...s.srData,
      [item.questionId]: calculateNextSpacedRepetition(s.srData?.[item.questionId], false)
    };
  }

  queue.splice(s.currentQuestionIndex, 1);
  const minGap = Math.min(3, queue.length);
  const spliceIndex = Math.min(queue.length, s.currentQuestionIndex + minGap);
  queue.splice(spliceIndex, 0, item);

  const nextQ = getQuestionForQueueItem(s.questions, queue[s.currentQuestionIndex]);
  s.shuffledAnswerOrder = nextQ ? shuffleIndices(nextQ.answers.length) : [];
  s.queue = queue;
  return s;
}

export function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
