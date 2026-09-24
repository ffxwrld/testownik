import { Question, ChunkInfo, QueueItem } from '@/models/types';
import { shuffle } from '@/utils/shuffle';

export function getChunkList(totalQuestions: number, chunkSize: number): ChunkInfo[] {
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
  repeatMode: number | 'spaced',
  doneIds: string[]
): QueueItem[] {
  const doneSet = new Set(doneIds);
  const chunkQuestions = questions.slice(chunk.startIndex, chunk.endIndex + 1);
  const remainingQuestions = chunkQuestions.filter(q => !doneSet.has(q.id));
  const questionsToQueue = remainingQuestions.length > 0 ? remainingQuestions : chunkQuestions;

  const shuffled = shuffle([...questionsToQueue]);
  const initialStreak = (typeof repeatMode === 'number' && repeatMode > 1) ? repeatMode : 1;

  return shuffled.map(q => ({
    questionId: q.id,
    requiredCorrectStreak: initialStreak,
    consecutiveCorrect: 0,
    wrongCount: 0,
    firstAnswerWrong: false,
  }));
}
