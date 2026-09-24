import { SessionState, QueueItem, SpacedRepetitionData } from '@/models/types';
import { shuffle, shuffleIndices } from '@/utils/shuffle';

export function prepareSpacedRepetitionQueue(session: SessionState): SessionState {
  if (session.repeatMode !== 'spaced') return session;

  const now = Date.now();
  const srData = session.srData || {};
  const currentQueueIds = new Set(session.queue.map(q => q.questionId));
  const currentDoneIds = new Set(session.done);

  const newlyDueQuestions = session.questions.filter(q => {
    if (currentQueueIds.has(q.id) || currentDoneIds.has(q.id)) return false;
    const data = srData[q.id];
    return !data || data.dueDate <= now;
  });

  if (newlyDueQuestions.length === 0) {
    return session;
  }

  const shuffled = shuffle([...newlyDueQuestions]);
  const newQueueItems: QueueItem[] = shuffled.map(q => ({
    questionId: q.id,
    requiredCorrectStreak: 1, 
    consecutiveCorrect: 0,
    wrongCount: 0,
    firstAnswerWrong: false,
  }));

  const updatedQueue = [...session.queue, ...newQueueItems];
  
  let updatedShuffledAnswerOrder = session.shuffledAnswerOrder;
  if (session.queue.length === 0 && updatedQueue.length > 0) {
    const firstQ = session.questions.find(q => q.id === updatedQueue[0].questionId);
    if (firstQ) {
      updatedShuffledAnswerOrder = shuffleIndices(firstQ.answers.length);
    }
  }

  return {
    ...session,
    queue: updatedQueue,
    shuffledAnswerOrder: updatedShuffledAnswerOrder,
    phase: updatedQueue.length === 0 ? 'summary' : 'test',
  };
}

export function calculateNextSpacedRepetition(
  currentData: SpacedRepetitionData | undefined,
  isCorrect: boolean
): SpacedRepetitionData {
  const sr = currentData || { efactor: 2.5, interval: 0, repetitions: 0, dueDate: 0 };
  
  if (!isCorrect) {
    return {
      ...sr,
      repetitions: 0,
      interval: 1,
      efactor: Math.max(1.3, sr.efactor - 0.2), // penalty
    };
  }

  const reps = sr.repetitions + 1;
  let interval = 1;
  
  if (reps === 1) {
    interval = 1;
  } else if (reps === 2) {
    interval = 6;
  } else {
    interval = Math.round(sr.interval * sr.efactor);
  }
  
  return {
    efactor: sr.efactor,
    interval,
    repetitions: reps,
    dueDate: Date.now() + interval * 24 * 60 * 60 * 1000,
  };
}
