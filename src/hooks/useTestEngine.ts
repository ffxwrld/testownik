import { useState, useRef, useEffect, useCallback } from 'react';
import { SessionState, Question, AnswerFeedback } from '../models/types';
import {
  getQuestionForQueueItem,
  saveSession,
  processCorrectAnswer,
  processWrongAnswer,
} from '../utils/session';
import { findShuffledPosition } from '../utils/shuffle';

export interface PreviousQuestionData {
  question: Question;
  shuffledOrder: number[];
  correctShuffledIndices: number[];
  feedback: AnswerFeedback;
}

interface UseTestEngineProps {
  session: SessionState;
  sessionId: string;
  onSessionUpdate: (session: SessionState) => void;
  onQuitToggle: () => void;
  showingPrevious: boolean;
  setShowingPrevious: React.Dispatch<React.SetStateAction<boolean>>;
}

const FEEDBACK_DELAY_MS = 150;
const ANSWER_KEYS = ['1', '2', '3', '4', '5', '6'];

export function useTestEngine({
  session,
  sessionId,
  onSessionUpdate,
  onQuitToggle,
  showingPrevious,
  setShowingPrevious,
}: UseTestEngineProps) {
  const [elapsed, setElapsed] = useState(session.elapsedSeconds);
  const [isAfk, setIsAfk] = useState(false);
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [questionKey, setQuestionKey] = useState(0);
  const [processedSession, setProcessedSession] = useState<SessionState | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [optimisticStreak, setOptimisticStreak] = useState<number | null>(null);
  const [optimisticWrongCount, setOptimisticWrongCount] = useState<number | null>(null);
  const [previousQuestion, setPreviousQuestion] = useState<PreviousQuestionData | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sessionRef = useRef(session);
  sessionRef.current = session;
  const elapsedRef = useRef(elapsed);
  elapsedRef.current = elapsed;
  const lastActivityRef = useRef(Date.now());
  const processedSessionRef = useRef<SessionState | null>(null);

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    timerRef.current = setInterval(() => {
      setElapsed(prev => {
        const next = prev + 1;
        if (next % 5 === 0) {
          const updated = { ...sessionRef.current, elapsedSeconds: next };
          saveSession(updated, sessionId).catch(console.error);
        }
        return next;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      const finalBase = processedSessionRef.current ?? sessionRef.current;
      const updated = { ...finalBase, elapsedSeconds: elapsedRef.current };
      saveSession(updated, sessionId).catch(console.error);
    };
  }, [sessionId]);


  // Track activity to prevent AFK
  useEffect(() => {
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };

    // Update activity on mount
    updateActivity();

    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('touchstart', updateActivity);
    window.addEventListener('scroll', updateActivity);
    window.addEventListener('click', updateActivity);

    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('touchstart', updateActivity);
      window.removeEventListener('scroll', updateActivity);
      window.removeEventListener('click', updateActivity);
    };
  }, []);

  const currentItem = session.queue[session.currentQuestionIndex];
  const currentQuestion = getQuestionForQueueItem(session.questions, currentItem);
  const shuffledOrder = session.shuffledAnswerOrder;

  const correctOriginalIndices: number[] = currentQuestion
    ? (currentQuestion.correctAnswerIndices ?? [currentQuestion.correctAnswerIndex])
    : [];

  const isMultiAnswer = correctOriginalIndices.length > 1;

  const correctShuffledIndices: number[] = correctOriginalIndices.map(origIdx =>
    findShuffledPosition(shuffledOrder, origIdx)
  );

  const handleToggleAnswer = useCallback(
    (shuffledIndex: number) => {
      if (feedback !== null || isTransitioning || !currentQuestion) return;

      setSelectedIndices(prev => {
        if (isMultiAnswer) {
          return prev.includes(shuffledIndex)
            ? prev.filter(i => i !== shuffledIndex)
            : [...prev, shuffledIndex];
        } else {
          return prev.includes(shuffledIndex) ? [] : [shuffledIndex];
        }
      });
    },
    [feedback, isTransitioning, currentQuestion, isMultiAnswer]
  );

  const handleConfirm = useCallback(() => {
    if (feedback !== null || isTransitioning || !currentQuestion) return;

    const isSkip = selectedIndices.length === 0;

    const allSelectedCorrect = !isSkip && selectedIndices.every(si =>
      correctShuffledIndices.includes(si)
    );
    const allCorrectSelected = !isSkip && correctShuffledIndices.every(ci =>
      selectedIndices.includes(ci)
    );
    const isCorrect = !isSkip && allSelectedCorrect && allCorrectSelected;

    if (isCorrect) {
      setOptimisticStreak((currentItem?.consecutiveCorrect ?? 0) + 1);
      setOptimisticWrongCount(null);
    } else {
      setOptimisticStreak(0);
      setOptimisticWrongCount((currentItem?.wrongCount ?? 0) + 1);
    }

    const newFeedback: AnswerFeedback = {
      selectedAnswerIndices: selectedIndices,
      state: isCorrect ? 'correct' : 'wrong',
      correctShuffledIndices,
    };

    setFeedback(newFeedback);
    setIsTransitioning(true);

    feedbackTimeoutRef.current = setTimeout(() => {
      const currentElapsed = elapsedRef.current;
      const baseSession = { ...sessionRef.current, elapsedSeconds: currentElapsed };
      const updatedSession = isCorrect
        ? processCorrectAnswer(baseSession)
        : processWrongAnswer(baseSession);

      saveSession(updatedSession, sessionId).catch(console.error);
      setProcessedSession(updatedSession);
      setIsTransitioning(false);
    }, FEEDBACK_DELAY_MS);
  }, [
    feedback,
    isTransitioning,
    currentQuestion,
    selectedIndices,
    correctShuffledIndices,
    currentItem,
    sessionId,
  ]);

  const handleNext = useCallback(() => {
    if (currentQuestion && feedback) {
      setPreviousQuestion({
        question: currentQuestion,
        shuffledOrder,
        correctShuffledIndices,
        feedback,
      });
    }

    setFeedback(null);
    setSelectedIndices([]);
    setOptimisticStreak(null);
    setOptimisticWrongCount(null);
    setQuestionKey(k => k + 1);
    setShowingPrevious(false);
    
    if (processedSession) {
      processedSessionRef.current = processedSession;
      onSessionUpdate(processedSession);
      setProcessedSession(null);
    }
  }, [processedSession, onSessionUpdate, currentQuestion, feedback, shuffledOrder, correctShuffledIndices, setShowingPrevious]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [questionKey]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) return;

      if (e.key === 'Escape') {
        if (showingPrevious) {
          setShowingPrevious(false);
        } else {
          onQuitToggle();
        }
        return;
      }

      if (e.key === 'Backspace' && previousQuestion) {
        e.preventDefault();
        setShowingPrevious(prev => !prev);
        return;
      }

      if ((e.key === ' ' || e.key === 'Enter') && !isTransitioning) {
        e.preventDefault();
        if (showingPrevious) {
          setShowingPrevious(false);
          return;
        }
        if (feedback !== null) {
          handleNext();
        } else {
          handleConfirm();
        }
        return;
      }

      const idx = ANSWER_KEYS.indexOf(e.key);
      if (idx !== -1 && idx < (currentQuestion?.answers.length ?? 0) && feedback === null && !showingPrevious) {
        handleToggleAnswer(idx);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleToggleAnswer, handleConfirm, handleNext, currentQuestion, feedback, isTransitioning, showingPrevious, previousQuestion, onQuitToggle, setShowingPrevious]);

  const totalQuestions = session.questions.length;

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

  const progressPercent = totalQuestions > 0 ? (doneCount / totalQuestions) * 100 : 0;

  const canConfirm = feedback === null && !isTransitioning;

  return {
    elapsed,
    isAfk,
    setIsAfk,
    feedback,
    isTransitioning,
    questionKey,
    selectedIndices,
    previousQuestion,
    currentItem,
    currentQuestion,
    shuffledOrder,
    correctShuffledIndices,
    isMultiAnswer,
    canConfirm,
    totalQuestions,
    doneCount,
    remainingCount,
    progressPercent,
    consecutiveCorrect,
    requiredStreak,
    wrongCountForCurrent,
    handleToggleAnswer,
    handleConfirm,
    handleNext,
  };
}
