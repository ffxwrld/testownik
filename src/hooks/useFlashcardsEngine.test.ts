import { describe, it, expect } from 'vitest';
import { renderHook, act } from '../test/hookTester';
import { useFlashcardsEngine } from './useFlashcardsEngine';
import { Question } from '../models/types';
import { buildInitialSession } from '../utils/session';

const mockQuestions: Question[] = [
  {
    id: 'fc-1',
    text: 'What is React?',
    sourceFile: 'react.txt',
    answers: [
      { id: 'a1', text: 'A JavaScript library for UI', isCorrect: true },
      { id: 'a2', text: 'A database', isCorrect: false },
    ],
    correctAnswerIndex: 0,
    correctAnswerIndices: [0],
  },
  {
    id: 'fc-2',
    text: 'What is TypeScript?',
    sourceFile: 'ts.txt',
    answers: [
      { id: 'b1', text: 'Typed JavaScript', isCorrect: true },
      { id: 'b2', text: 'A stylesheet', isCorrect: false },
    ],
    correctAnswerIndex: 0,
    correctAnswerIndices: [0],
  },
];

const mockSession = buildInitialSession(mockQuestions, 1, 'Flashcards Test');

describe('useFlashcardsEngine', () => {
  it('initializes with correct questions, index 0, and un-flipped card', () => {
    const { result } = renderHook(() => useFlashcardsEngine(mockSession));

    expect(result.current.state.questions.length).toBe(2);
    expect(result.current.state.currentIndex).toBe(0);
    expect(result.current.isFlipped).toBe(false);
    expect(result.current.state.isFinished).toBe(false);
    expect(result.current.totalUnique).toBe(2);
    expect(result.current.currentQuestion).toBeDefined();
  });

  it('flips card back and forth via flipCard', () => {
    const { result } = renderHook(() => useFlashcardsEngine(mockSession));

    expect(result.current.isFlipped).toBe(false);

    act(() => {
      result.current.flipCard();
    });
    expect(result.current.isFlipped).toBe(true);

    act(() => {
      result.current.flipCard();
    });
    expect(result.current.isFlipped).toBe(false);
  });

  it('markKnown adds id to masteredIds and advances index', () => {
    const { result } = renderHook(() => useFlashcardsEngine(mockSession));

    const firstId = result.current.currentQuestion?.id;
    expect(firstId).toBeDefined();

    act(() => {
      result.current.flipCard();
    });
    expect(result.current.isFlipped).toBe(true);

    act(() => {
      result.current.markKnown();
    });

    expect(result.current.isFlipped).toBe(false);
    expect(result.current.state.currentIndex).toBe(1);
    expect(result.current.state.masteredIds.has(firstId!)).toBe(true);
    expect(result.current.state.isFinished).toBe(false);
  });

  it('sets isFinished to true when all cards are mastered', () => {
    const { result } = renderHook(() => useFlashcardsEngine(mockSession));

    act(() => {
      result.current.markKnown(); // card 1
    });
    expect(result.current.state.isFinished).toBe(false);

    act(() => {
      result.current.markKnown(); // card 2
    });
    expect(result.current.state.isFinished).toBe(true);
    expect(result.current.currentQuestion).toBeUndefined();
  });

  it('markRepeat duplicates the card at the end of the deck and advances index', () => {
    const { result } = renderHook(() => useFlashcardsEngine(mockSession));

    const firstId = result.current.currentQuestion?.id;

    act(() => {
      result.current.markRepeat();
    });

    expect(result.current.state.reviewIds.has(firstId!)).toBe(true);
    // Queue length should have increased from 2 to 3
    expect(result.current.state.questions.length).toBe(3);
    expect(result.current.state.currentIndex).toBe(1);
    expect(result.current.state.isFinished).toBe(false);
  });

  it('handles defensives: markKnown and markRepeat when out of bounds do not crash', () => {
    const { result } = renderHook(() => useFlashcardsEngine(mockSession));

    // Master both cards to reach out of bounds
    act(() => {
      result.current.markKnown();
      result.current.markKnown();
    });

    expect(result.current.state.isFinished).toBe(true);

    // Call markKnown again when no current question exists
    act(() => {
      result.current.markKnown();
      result.current.markRepeat();
    });

    expect(result.current.state.isFinished).toBe(true);
    expect(result.current.state.currentIndex).toBe(2);
  });

  it('restarts session to initial state', () => {
    const { result } = renderHook(() => useFlashcardsEngine(mockSession));

    act(() => {
      result.current.markKnown();
      result.current.flipCard();
    });
    expect(result.current.state.currentIndex).toBe(1);

    act(() => {
      result.current.restart();
    });

    expect(result.current.state.currentIndex).toBe(0);
    expect(result.current.state.masteredIds.size).toBe(0);
    expect(result.current.state.reviewIds.size).toBe(0);
    expect(result.current.isFlipped).toBe(false);
    expect(result.current.state.isFinished).toBe(false);
  });
});
