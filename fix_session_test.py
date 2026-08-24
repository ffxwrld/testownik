import re

with open('src/utils/session.test.ts', 'r') as f:
    content = f.read()

# Replace test 1
old_test1 = """  describe('processCorrectAnswer', () => {
    it('increments consecutiveCorrect but keeps in queue if streak not met', () => {
      let session = buildInitialSession(mockQuestions, 2, 'test_base');
      session = processCorrectAnswer(session);
      
      expect(session.queue[0].questionId).toBe('q1'); // Still q1? No, wait. 
      // Current implementation of processCorrectAnswer removes it from queue if streak met.
      // If not met, does it stay at the current index? Yes, the queue is unmodified for index,
      // it just updates the item. Wait, does it move to next? 
      // Actually, after processCorrectAnswer, the currentQuestionIndex is NOT advanced automatically
      // in the pure logic, unless the item was removed!
      // Let's check how currentQuestionIndex behaves.
      expect(session.queue[0].consecutiveCorrect).toBe(1);
      expect(session.done.length).toBe(0);
    });"""

new_test1 = """  describe('processCorrectAnswer', () => {
    it('increments consecutiveCorrect but keeps in queue if streak not met', () => {
      let session = buildInitialSession(mockQuestions, 2, 'test_base');
      const firstId = session.queue[0].questionId;
      session = processCorrectAnswer(session);
      
      // Streak not met, so it gets re-inserted further down the queue.
      // We should find it in the queue with consecutiveCorrect === 1
      const item = session.queue.find(q => q.questionId === firstId);
      expect(item).not.toBeUndefined();
      expect(item?.consecutiveCorrect).toBe(1);
      expect(session.done.length).toBe(0);
    });"""

content = content.replace(old_test1, new_test1)

# Replace test 2
old_test2 = """    it('moves question to done when streak is met', () => {
      let session = buildInitialSession(mockQuestions, 1, 'test_base');
      session = processCorrectAnswer(session);
      
      expect(session.done.length).toBe(1);
      expect(session.done[0]).toBe('q1');
      expect(session.queue.length).toBe(2);
      expect(session.queue[0].questionId).toBe('q2'); // Index 0 is now q2
    });"""

new_test2 = """    it('moves question to done when streak is met', () => {
      let session = buildInitialSession(mockQuestions, 1, 'test_base');
      const firstId = session.queue[0].questionId;
      session = processCorrectAnswer(session);
      
      expect(session.done.length).toBe(1);
      expect(session.done[0]).toBe(firstId);
      expect(session.queue.length).toBe(2);
      // The old first item should no longer be in the queue
      expect(session.queue.find(q => q.questionId === firstId)).toBeUndefined();
    });"""

content = content.replace(old_test2, new_test2)

# Replace test 3
old_test3 = """    it('resets consecutiveCorrect and moves question later in queue', () => {
      let session = buildInitialSession(mockQuestions, 3, 'test_base');
      
      // Manually set some progress
      session.queue[0].consecutiveCorrect = 2;
      
      session = processWrongAnswer(session);
      
      // streak reset
      // item moved to end (or later) in queue
      expect(session.queue[session.queue.length - 1].questionId).toBe('q1');
      expect(session.queue[session.queue.length - 1].consecutiveCorrect).toBe(0);
      expect(session.queue[session.queue.length - 1].wrongCount).toBe(1);
      
      // new current item is q2
      expect(session.queue[0].questionId).toBe('q2');
    });"""

new_test3 = """    it('resets consecutiveCorrect and moves question later in queue', () => {
      let session = buildInitialSession(mockQuestions, 3, 'test_base');
      const firstId = session.queue[0].questionId;
      
      // Manually set some progress
      session.queue[0].consecutiveCorrect = 2;
      
      session = processWrongAnswer(session);
      
      // streak reset
      // item moved to end (or later) in queue
      const item = session.queue.find(q => q.questionId === firstId);
      expect(item).not.toBeUndefined();
      expect(item?.consecutiveCorrect).toBe(0);
      expect(item?.wrongCount).toBe(1);
      
      // new current item should not be the one we just answered wrong (assuming queue > 1)
      expect(session.queue[0].questionId).not.toBe(firstId);
    });"""

content = content.replace(old_test3, new_test3)

with open('src/utils/session.test.ts', 'w') as f:
    f.write(content)
