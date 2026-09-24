import { DoneStat, Question, SessionState } from '@/models/types';

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
