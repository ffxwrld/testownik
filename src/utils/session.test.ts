import { describe, it, expect } from 'vitest';
import { buildInitialSession, processCorrectAnswer, processWrongAnswer } from './session';
import { Question } from '../models/types';

const mockQuestions: Question[] = [
  { id: 'q1', text: 'Q1', sourceFile: 'f1', answers: [], correctAnswerIndex: 0, correctAnswerIndices: [0] },
  { id: 'q2', text: 'Q2', sourceFile: 'f1', answers: [], correctAnswerIndex: 0, correctAnswerIndices: [0] },
  { id: 'q3', text: 'Q3', sourceFile: 'f1', answers: [], correctAnswerIndex: 0, correctAnswerIndices: [0] },
];

describe('session.ts', () => {
  describe('buildInitialSession', () => {
    it('initializes session with correct repeatMode', () => {
      const session = buildInitialSession(mockQuestions, 3, 'test_base');
      expect(session.questions.length).toBe(3);
      expect(session.queue.length).toBe(3);
      expect(session.queue[0].requiredCorrectStreak).toBe(3);
      expect(session.queue[0].consecutiveCorrect).toBe(0);
      expect(session.done.length).toBe(0);
    });
  });

  describe('processCorrectAnswer', () => {
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
    });

    it('moves question to done when streak is met', () => {
      let session = buildInitialSession(mockQuestions, 1, 'test_base');
      const firstId = session.queue[0].questionId;
      session = processCorrectAnswer(session);
      
      expect(session.done.length).toBe(1);
      expect(session.done[0]).toBe(firstId);
      expect(session.queue.length).toBe(2);
      // The old first item should no longer be in the queue
      expect(session.queue.find(q => q.questionId === firstId)).toBeUndefined();
    });
  });

  describe('processWrongAnswer', () => {
    it('resets consecutiveCorrect and moves question later in queue', () => {
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
    });
  });
});
