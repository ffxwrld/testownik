import { describe, it, expect } from 'vitest';
import {
  buildInitialSession,
  processCorrectAnswer,
  processWrongAnswer,
  getChunkList,
  getChunkProgress,
  buildChunkQueue,
} from './session';
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

  describe('chunking helpers', () => {
    const questions150: Question[] = Array.from({ length: 150 }, (_, i) => ({
      id: `q${i + 1}`,
      text: `Question ${i + 1}`,
      sourceFile: 'base.txt',
      answers: [],
      correctAnswerIndex: 0,
      correctAnswerIndices: [0],
    }));

    it('splits 150 questions into 3 chunks of 50', () => {
      const chunks = getChunkList(150, 50);
      expect(chunks.length).toBe(3);
      expect(chunks[0]).toEqual({ index: 0, startIndex: 0, endIndex: 49, totalQuestions: 50 });
      expect(chunks[1]).toEqual({ index: 1, startIndex: 50, endIndex: 99, totalQuestions: 50 });
      expect(chunks[2]).toEqual({ index: 2, startIndex: 100, endIndex: 149, totalQuestions: 50 });
    });

    it('calculates chunk progress correctly', () => {
      const chunks = getChunkList(150, 50);
      // Mark first 25 questions as done
      const doneIds = Array.from({ length: 25 }, (_, i) => `q${i + 1}`);
      const prog = getChunkProgress(chunks[0], questions150, doneIds);
      expect(prog.completed).toBe(25);
      expect(prog.total).toBe(50);
      expect(prog.percent).toBe(50);

      // Chunk 1 has 0 done
      const prog2 = getChunkProgress(chunks[1], questions150, doneIds);
      expect(prog2.completed).toBe(0);
      expect(prog2.percent).toBe(0);
    });

    it('builds chunk queue prioritizing remaining questions', () => {
      const chunks = getChunkList(150, 50);
      // Mark first 40 questions as done
      const doneIds = Array.from({ length: 40 }, (_, i) => `q${i + 1}`);
      const queue = buildChunkQueue(questions150, chunks[0], 1, doneIds);
      expect(queue.length).toBe(10);
      expect(queue.every(item => !doneIds.includes(item.questionId))).toBe(true);
    });

    it('preserves phase as test when completing a chunk with activeChunkIndex', () => {
      let session = buildInitialSession(mockQuestions, 1, 'test_base');
      session.chunkConfig = {
        enabled: true,
        chunkSize: 2,
        activeChunkIndex: 0,
      };
      // Keep only 1 item in queue to simulate last question of chunk
      session.queue = [session.queue[0]];
      session = processCorrectAnswer(session);
      expect(session.queue.length).toBe(0);
      // Phase should remain 'test' so completion modal can be shown!
      expect(session.phase).toBe('test');
    });
  });
});
