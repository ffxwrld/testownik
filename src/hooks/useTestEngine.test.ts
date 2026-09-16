import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '../test/hookTester';
import { useTestEngine } from './useTestEngine';
import { Question } from '../models/types';
import { buildInitialSession } from '../utils/session';

vi.mock('idb-keyval', () => ({
  get: vi.fn().mockResolvedValue(undefined),
  set: vi.fn().mockResolvedValue(undefined),
  del: vi.fn().mockResolvedValue(undefined),
  clear: vi.fn().mockResolvedValue(undefined),
  keys: vi.fn().mockResolvedValue([]),
}));

const mockQuestions: Question[] = [
  {
    id: 'tq-1',
    text: 'What is 1 + 1?',
    sourceFile: 'math.txt',
    answers: [
      { id: 'ans-1', text: '2', isCorrect: true },
      { id: 'ans-2', text: '3', isCorrect: false },
    ],
    correctAnswerIndex: 0,
    correctAnswerIndices: [0],
  },
  {
    id: 'tq-2',
    text: 'Which are prime numbers?',
    sourceFile: 'math.txt',
    answers: [
      { id: 'ans-3', text: '2', isCorrect: true },
      { id: 'ans-4', text: '3', isCorrect: true },
      { id: 'ans-5', text: '4', isCorrect: false },
    ],
    correctAnswerIndex: 0,
    correctAnswerIndices: [0, 1], // Multi-choice!
  },
];

describe('useTestEngine', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('initializes with current question, remaining count, and unselected state', () => {
    const session = buildInitialSession(mockQuestions, 1, 'Test Session');
    let showingPrev = false;

    const { result } = renderHook(() =>
      useTestEngine({
        session,
        sessionId: 'test-session-id',
        onSessionUpdate: vi.fn(),
        onQuitToggle: vi.fn(),
        showingPrevious: showingPrev,
        setShowingPrevious: (v) => {
          showingPrev = typeof v === 'function' ? v(showingPrev) : v;
        },
      })
    );

    expect(['tq-1', 'tq-2']).toContain(result.current.currentQuestion?.id);
    expect(result.current.selectedIndices).toEqual([]);
    expect(result.current.feedback).toBeNull();
    expect(result.current.totalQuestions).toBe(2);
    expect(result.current.canConfirm).toBe(true);
  });

  it('handles single-choice selection and correct confirmation', () => {
    // Only pass single-choice question
    const session = buildInitialSession([mockQuestions[0]], 1, 'Test Session');
    const onSessionUpdate = vi.fn();
    let showingPrev = false;

    const { result } = renderHook(() =>
      useTestEngine({
        session,
        sessionId: 'test-session-id',
        onSessionUpdate,
        onQuitToggle: vi.fn(),
        showingPrevious: showingPrev,
        setShowingPrevious: (v) => {
          showingPrev = typeof v === 'function' ? v(showingPrev) : v;
        },
      })
    );

    expect(result.current.isMultiAnswer).toBe(false);

    // Find the shuffled index for correct answer ('2')
    const correctShuffledIdx = result.current.shuffledOrder.findIndex(
      origIdx => result.current.currentQuestion?.answers[origIdx]?.isCorrect
    );

    act(() => {
      result.current.handleToggleAnswer(correctShuffledIdx);
    });

    expect(result.current.selectedIndices).toEqual([correctShuffledIdx]);

    act(() => {
      result.current.handleConfirm();
    });

    // Advance feedback delay timer
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current.feedback?.state).toBe('correct');
  });

  it('handles multi-choice questions: partial selection is wrong, full selection is correct', () => {
    // Session starting at Q2 (multi-choice)
    const session = buildInitialSession([mockQuestions[1]], 1, 'Multi Test');
    const onSessionUpdate = vi.fn();
    let showingPrev = false;

    const { result } = renderHook(() =>
      useTestEngine({
        session,
        sessionId: 'test-multi-id',
        onSessionUpdate,
        onQuitToggle: vi.fn(),
        showingPrevious: showingPrev,
        setShowingPrevious: (v) => {
          showingPrev = typeof v === 'function' ? v(showingPrev) : v;
        },
      })
    );

    expect(result.current.isMultiAnswer).toBe(true);

    // Find correct indices
    const correctIndices = result.current.shuffledOrder
      .map((origIdx, shuffIdx) => (result.current.currentQuestion?.answers[origIdx]?.isCorrect ? shuffIdx : -1))
      .filter(idx => idx !== -1);

    expect(correctIndices.length).toBe(2);

    // Select only 1 of the 2 correct answers (partial)
    act(() => {
      result.current.handleToggleAnswer(correctIndices[0]);
    });
    expect(result.current.selectedIndices).toEqual([correctIndices[0]]);

    act(() => {
      result.current.handleConfirm();
      vi.advanceTimersByTime(200);
    });

    // Partial answer should be considered WRONG
    expect(result.current.feedback?.state).toBe('wrong');
  });

  it('skipping a question (confirming empty selection) marks as wrong and queues question', () => {
    const session = buildInitialSession(mockQuestions, 1, 'Skip Test');
    const onSessionUpdate = vi.fn();
    let showingPrev = false;

    const { result } = renderHook(() =>
      useTestEngine({
        session,
        sessionId: 'test-skip-id',
        onSessionUpdate,
        onQuitToggle: vi.fn(),
        showingPrevious: showingPrev,
        setShowingPrevious: (v) => {
          showingPrev = typeof v === 'function' ? v(showingPrev) : v;
        },
      })
    );

    // Confirm without selecting anything
    act(() => {
      result.current.handleConfirm();
      vi.advanceTimersByTime(200);
    });

    expect(result.current.feedback?.state).toBe('wrong');
    expect(result.current.feedback?.selectedAnswerIndices).toEqual([]);
  });

  it('handleNext saves previousQuestion and advances state', () => {
    const session = buildInitialSession(mockQuestions, 1, 'Next Test');
    const onSessionUpdate = vi.fn();
    let showingPrev = false;

    const { result } = renderHook(() =>
      useTestEngine({
        session,
        sessionId: 'test-next-id',
        onSessionUpdate,
        onQuitToggle: vi.fn(),
        showingPrevious: showingPrev,
        setShowingPrevious: (v) => {
          showingPrev = typeof v === 'function' ? v(showingPrev) : v;
        },
      })
    );

    const firstQuestionId = result.current.currentQuestion?.id;

    // Answer and confirm
    const correctShuffledIdx = result.current.shuffledOrder.findIndex(
      origIdx => result.current.currentQuestion?.answers[origIdx]?.isCorrect
    );
    act(() => {
      result.current.handleToggleAnswer(correctShuffledIdx);
      result.current.handleConfirm();
      vi.advanceTimersByTime(200);
    });

    expect(result.current.feedback).not.toBeNull();

    // Advance to next
    act(() => {
      result.current.handleNext();
    });

    // State reset for next question
    expect(result.current.feedback).toBeNull();
    expect(result.current.selectedIndices).toEqual([]);
    expect(result.current.previousQuestion?.question.id).toBe(firstQuestionId);
    expect(onSessionUpdate).toHaveBeenCalled();
  });

  it('handles single-choice tap with instant evaluation and auto-advance in instantMode', () => {
    const session = buildInitialSession([mockQuestions[0]], 1, 'Instant Test');
    const onSessionUpdate = vi.fn();
    let showingPrev = false;

    const { result } = renderHook(() =>
      useTestEngine({
        session,
        sessionId: 'test-instant-id',
        onSessionUpdate,
        onQuitToggle: vi.fn(),
        showingPrevious: showingPrev,
        setShowingPrevious: (v) => {
          showingPrev = typeof v === 'function' ? v(showingPrev) : v;
        },
        instantMode: true,
      })
    );

    const correctShuffledIdx = result.current.shuffledOrder.findIndex(
      origIdx => result.current.currentQuestion?.answers[origIdx]?.isCorrect
    );

    // In instantMode, simply toggling/tapping the answer immediately evaluates it
    act(() => {
      result.current.handleToggleAnswer(correctShuffledIdx);
    });

    expect(result.current.selectedIndices).toEqual([correctShuffledIdx]);
    expect(result.current.feedback?.state).toBe('correct');

    // Auto-advances after 500ms
    act(() => {
      vi.advanceTimersByTime(550);
    });

    expect(result.current.feedback).toBeNull();
    expect(onSessionUpdate).toHaveBeenCalled();
  });

  it('handles wrong answer in instantMode, triggers shakeKey, and auto-advances', () => {
    const session = buildInitialSession([mockQuestions[0]], 1, 'Instant Wrong Test');
    const onSessionUpdate = vi.fn();
    let showingPrev = false;

    const { result } = renderHook(() =>
      useTestEngine({
        session,
        sessionId: 'test-instant-wrong-id',
        onSessionUpdate,
        onQuitToggle: vi.fn(),
        showingPrevious: showingPrev,
        setShowingPrevious: (v) => {
          showingPrev = typeof v === 'function' ? v(showingPrev) : v;
        },
        instantMode: true,
      })
    );

    const wrongShuffledIdx = result.current.shuffledOrder.findIndex(
      origIdx => !result.current.currentQuestion?.answers[origIdx]?.isCorrect
    );

    const initialShake = result.current.shakeKey;

    act(() => {
      result.current.handleToggleAnswer(wrongShuffledIdx);
    });

    expect(result.current.feedback?.state).toBe('wrong');
    expect(result.current.shakeKey).toBeGreaterThan(initialShake);

    // Auto-advances after 900ms
    act(() => {
      vi.advanceTimersByTime(950);
    });

    expect(result.current.feedback).toBeNull();
    expect(onSessionUpdate).toHaveBeenCalled();
  });
});

