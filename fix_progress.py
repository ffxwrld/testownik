import re

with open('src/hooks/useTestEngine.ts', 'r') as f:
    content = f.read()

old_block = """  const totalQuestions = session.questions.length;
  const doneCount = session.done.length;
  const remainingCount = session.queue.length;
  const progressPercent = totalQuestions > 0 ? (doneCount / totalQuestions) * 100 : 0;

  const consecutiveCorrect = optimisticStreak !== null
    ? optimisticStreak
    : (currentItem?.consecutiveCorrect ?? 0);
  const requiredStreak = currentItem?.requiredCorrectStreak ?? 1;
  const wrongCountForCurrent = optimisticWrongCount !== null
    ? optimisticWrongCount
    : (currentItem?.wrongCount ?? 0);"""

new_block = """  const totalQuestions = session.questions.length;

  const consecutiveCorrect = optimisticStreak !== null
    ? optimisticStreak
    : (currentItem?.consecutiveCorrect ?? 0);
  const requiredStreak = currentItem?.requiredCorrectStreak ?? 1;
  const wrongCountForCurrent = optimisticWrongCount !== null
    ? optimisticWrongCount
    : (currentItem?.wrongCount ?? 0);

  let doneCount = session.done.length;
  let remainingCount = session.queue.length;

  // Optimistically update progress when correct answer is given
  if (feedback?.state === 'correct' && consecutiveCorrect >= requiredStreak) {
    doneCount += 1;
    remainingCount -= 1;
  }

  const progressPercent = totalQuestions > 0 ? (doneCount / totalQuestions) * 100 : 0;"""

content = content.replace(old_block, new_block)

with open('src/hooks/useTestEngine.ts', 'w') as f:
    f.write(content)
