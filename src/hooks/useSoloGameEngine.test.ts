import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '../test/hookTester';
import { useSoloGameEngine } from './useSoloGameEngine';
import { Question } from '../models/types';

const mockQuestions: Question[] = [
  {
    id: 'sg-1',
    text: 'What is 2 + 2?',
    sourceFile: 'math.txt',
    answers: [
      { id: 'a1', text: '4', isCorrect: true },
      { id: 'a2', text: '5', isCorrect: false },
    ],
    correctAnswerIndex: 0,
    correctAnswerIndices: [0],
  },
  {
    id: 'sg-2',
    text: 'What is 3 * 3?',
    sourceFile: 'math.txt',
    answers: [
      { id: 'b1', text: '9', isCorrect: true },
      { id: 'b2', text: '8', isCorrect: false },
    ],
    correctAnswerIndex: 0,
    correctAnswerIndices: [0],
  },
  {
    id: 'sg-3',
    text: 'What is 10 / 2?',
    sourceFile: 'math.txt',
    answers: [
      { id: 'c1', text: '5', isCorrect: true },
      { id: 'c2', text: '4', isCorrect: false },
    ],
    correctAnswerIndex: 0,
    correctAnswerIndices: [0],
  },
];

describe('useSoloGameEngine', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  describe('Sudden Death Mode', () => {
    it('initializes with 3 lives and score 0', () => {
      const { result } = renderHook(() =>
        useSoloGameEngine({
          mode: 'sudden-death',
          questions: mockQuestions,
          sessionId: 'test-sd',
          onExit: vi.fn(),
        })
      );

      expect(result.current.lives).toBe(3);
      expect(result.current.score).toBe(0);
      expect(result.current.gameState).toBe('playing');
      expect(result.current.combo).toBe(1);
      expect(result.current.timeRemaining).toBe(0);
    });

    it('loses a life and resets combo on incorrect answer', () => {
      const { result } = renderHook(() =>
        useSoloGameEngine({
          mode: 'sudden-death',
          questions: mockQuestions,
          sessionId: 'test-sd',
          onExit: vi.fn(),
        })
      );

      const wrongIdx = result.current.shuffledOrder.findIndex(
        origIdx => !result.current.currentQuestion?.answers[origIdx]?.isCorrect
      );

      act(() => {
        result.current.handleToggleAnswer(wrongIdx);
      });

      expect(result.current.lives).toBe(2);
      expect(result.current.combo).toBe(1);
      expect(result.current.streak).toBe(0);
      expect(result.current.feedback?.state).toBe('wrong');
    });

    it('triggers game over after losing all 3 lives', () => {
      const { result } = renderHook(() =>
        useSoloGameEngine({
          mode: 'sudden-death',
          questions: mockQuestions,
          sessionId: 'test-sd',
          onExit: vi.fn(),
        })
      );

      // 1st error
      let wrongIdx = result.current.shuffledOrder.findIndex(
        origIdx => !result.current.currentQuestion?.answers[origIdx]?.isCorrect
      );
      act(() => {
        result.current.handleToggleAnswer(wrongIdx);
      });
      expect(result.current.lives).toBe(2);

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // 2nd error
      wrongIdx = result.current.shuffledOrder.findIndex(
        origIdx => !result.current.currentQuestion?.answers[origIdx]?.isCorrect
      );
      act(() => {
        result.current.handleToggleAnswer(wrongIdx);
      });
      expect(result.current.lives).toBe(1);

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // 3rd error -> game over
      wrongIdx = result.current.shuffledOrder.findIndex(
        origIdx => !result.current.currentQuestion?.answers[origIdx]?.isCorrect
      );
      act(() => {
        result.current.handleToggleAnswer(wrongIdx);
      });
      expect(result.current.lives).toBe(0);

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.gameState).toBe('game_over');
    });
  });

  describe('Time Attack Mode', () => {
    it('initializes with 60s and grants +3s on correct answer', () => {
      const { result } = renderHook(() =>
        useSoloGameEngine({
          mode: 'time-attack',
          questions: mockQuestions,
          sessionId: 'test-ta',
          onExit: vi.fn(),
        })
      );

      expect(result.current.timeRemaining).toBe(60);
      expect(result.current.lives).toBe(0);

      const correctIdx = result.current.shuffledOrder.findIndex(
        origIdx => result.current.currentQuestion?.answers[origIdx]?.isCorrect
      );
      act(() => {
        result.current.handleToggleAnswer(correctIdx);
      });

      // 60s + 3s bonus
      expect(result.current.timeRemaining).toBe(63);
      expect(result.current.feedback?.state).toBe('correct');
      expect(result.current.score).toBeGreaterThan(0);
      expect(result.current.combo).toBe(2);
    });

    it('penalizes 5s on wrong answer in Time Attack', () => {
      const { result } = renderHook(() =>
        useSoloGameEngine({
          mode: 'time-attack',
          questions: mockQuestions,
          sessionId: 'test-ta',
          onExit: vi.fn(),
        })
      );

      const wrongIdx = result.current.shuffledOrder.findIndex(
        origIdx => !result.current.currentQuestion?.answers[origIdx]?.isCorrect
      );
      act(() => {
        result.current.handleToggleAnswer(wrongIdx);
      });

      // 60s - 5s penalty = 55s
      expect(result.current.timeRemaining).toBe(55);
      expect(result.current.feedback?.state).toBe('wrong');
      expect(result.current.combo).toBe(1);
    });

    it('increases combo multiplier on consecutive correct answers', () => {
      const { result } = renderHook(() =>
        useSoloGameEngine({
          mode: 'time-attack',
          questions: mockQuestions,
          sessionId: 'test-ta',
          onExit: vi.fn(),
        })
      );

      // Q1 correct
      let correctIdx = result.current.shuffledOrder.findIndex(
        origIdx => result.current.currentQuestion?.answers[origIdx]?.isCorrect
      );
      act(() => {
        result.current.handleToggleAnswer(correctIdx);
      });
      expect(result.current.combo).toBe(2);

      act(() => {
        vi.advanceTimersByTime(600);
      });

      // Q2 correct
      correctIdx = result.current.shuffledOrder.findIndex(
        origIdx => result.current.currentQuestion?.answers[origIdx]?.isCorrect
      );
      act(() => {
        result.current.handleToggleAnswer(correctIdx);
      });
      expect(result.current.combo).toBe(3);

      act(() => {
        vi.advanceTimersByTime(600);
      });

      // Q3 correct
      correctIdx = result.current.shuffledOrder.findIndex(
        origIdx => result.current.currentQuestion?.answers[origIdx]?.isCorrect
      );
      act(() => {
        result.current.handleToggleAnswer(correctIdx);
      });
      expect(result.current.combo).toBe(4);
    });
  });

  describe('Zen Mode', () => {
    it('initializes with 0 lives, 0 timeRemaining and does not lose lives on error', () => {
      const { result } = renderHook(() =>
        useSoloGameEngine({
          mode: 'zen',
          questions: mockQuestions,
          sessionId: 'test-zen',
          onExit: vi.fn(),
        })
      );

      expect(result.current.lives).toBe(0);
      expect(result.current.timeRemaining).toBe(0);

      const wrongIdx = result.current.shuffledOrder.findIndex(
        origIdx => !result.current.currentQuestion?.answers[origIdx]?.isCorrect
      );
      act(() => {
        result.current.handleToggleAnswer(wrongIdx);
      });

      expect(result.current.lives).toBe(0);
      expect(result.current.feedback?.state).toBe('wrong');
    });

    it('allows graceful session finish via handleFinishZen', () => {
      const { result } = renderHook(() =>
        useSoloGameEngine({
          mode: 'zen',
          questions: mockQuestions,
          sessionId: 'test-zen',
          onExit: vi.fn(),
        })
      );

      const correctIdx = result.current.shuffledOrder.findIndex(
        origIdx => result.current.currentQuestion?.answers[origIdx]?.isCorrect
      );
      act(() => {
        result.current.handleToggleAnswer(correctIdx);
      });

      act(() => {
        result.current.handleFinishZen();
      });

      expect(result.current.gameState).toBe('victory');
    });
  });
});
