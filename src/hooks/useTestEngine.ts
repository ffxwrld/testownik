import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { SessionState, Question, AnswerFeedback, ChunkConfig } from '../models/types';
import {
  getQuestionForQueueItem,
  saveSession,
  processCorrectAnswer,
  processWrongAnswer,
  getChunkList,
  buildChunkQueue,
} from '../utils/session';
import { findShuffledPosition, shuffleIndices, shuffle } from '../utils/shuffle';
import { playCorrectSound, playWrongSound } from '../utils/sound';

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
  instantMode?: boolean;
  onAnswerEvaluated?: (isCorrect: boolean, streak: number) => void;
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
  instantMode = false,
  onAnswerEvaluated,
}: UseTestEngineProps) {
  const [elapsed, setElapsed] = useState(session.elapsedSeconds);
  const [isAfk, setIsAfk] = useState(false);
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [questionKey, setQuestionKey] = useState(0);
  const [shakeKey, setShakeKey] = useState(0);
  const [processedSession, setProcessedSession] = useState<SessionState | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [optimisticStreak, setOptimisticStreak] = useState<number | null>(null);
  const [optimisticWrongCount, setOptimisticWrongCount] = useState<number | null>(null);
  const [previousQuestion, setPreviousQuestion] = useState<PreviousQuestionData | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoAdvanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sessionRef = useRef(session);
  sessionRef.current = session;
  const elapsedRef = useRef(elapsed);
  elapsedRef.current = elapsed;
  const lastActivityRef = useRef(Date.now());
  const processedSessionRef = useRef<SessionState | null>(null);

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
      if (autoAdvanceTimeoutRef.current) clearTimeout(autoAdvanceTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    timerRef.current = setInterval(() => {
      if (Date.now() - lastActivityRef.current > 60000) {
        setIsAfk(true);
        return;
      }

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

  const handleNext = useCallback(() => {
    if (autoAdvanceTimeoutRef.current) {
      clearTimeout(autoAdvanceTimeoutRef.current);
      autoAdvanceTimeoutRef.current = null;
    }
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = null;
    }

    if (currentQuestion && feedback) {
      setPreviousQuestion({
        question: currentQuestion,
        shuffledOrder,
        correctShuffledIndices,
        feedback,
      });
    }

    setFeedback(null);
    setIsTransitioning(false);
    setSelectedIndices([]);
    setOptimisticStreak(null);
    setOptimisticWrongCount(null);
    setQuestionKey(k => k + 1);
    setShowingPrevious(false);
    
    const sessionToApply = processedSessionRef.current ?? processedSession;
    if (sessionToApply) {
      processedSessionRef.current = null;
      onSessionUpdate(sessionToApply);
      setProcessedSession(null);
    }
  }, [processedSession, onSessionUpdate, currentQuestion, feedback, shuffledOrder, correctShuffledIndices, setShowingPrevious]);

  const evaluateAnswer = useCallback(
    (chosenIndices: number[]) => {
      if (feedback !== null || isTransitioning || !currentQuestion) return;

      const isSkip = chosenIndices.length === 0;

      const allSelectedCorrect = !isSkip && chosenIndices.every(si =>
        correctShuffledIndices.includes(si)
      );
      const allCorrectSelected = !isSkip && correctShuffledIndices.every(ci =>
        chosenIndices.includes(ci)
      );
      const isCorrect = !isSkip && allSelectedCorrect && allCorrectSelected;

      if (instantMode) {
        if (isCorrect) {
          playCorrectSound();
        } else {
          playWrongSound();
          setShakeKey(k => k + 1);
        }
      }

      if (isCorrect) {
        setOptimisticStreak((currentItem?.consecutiveCorrect ?? 0) + 1);
        setOptimisticWrongCount(null);
      } else {
        setOptimisticStreak(0);
        setOptimisticWrongCount((currentItem?.wrongCount ?? 0) + 1);
      }

      const evaluatedStreak = isCorrect ? ((currentItem?.consecutiveCorrect ?? 0) + 1) : 0;
      onAnswerEvaluated?.(isCorrect, evaluatedStreak);

      const newFeedback: AnswerFeedback = {
        selectedAnswerIndices: chosenIndices,
        state: isCorrect ? 'correct' : 'wrong',
        correctShuffledIndices,
      };

      setFeedback(newFeedback);
      setIsTransitioning(true);

      const currentElapsed = elapsedRef.current;
      const baseSession = { ...sessionRef.current, elapsedSeconds: currentElapsed };
      const updatedSession = isCorrect
        ? processCorrectAnswer(baseSession)
        : processWrongAnswer(baseSession);

      saveSession(updatedSession, sessionId).catch(console.error);
      processedSessionRef.current = updatedSession;
      setProcessedSession(updatedSession);

      if (instantMode) {
        setIsTransitioning(false);
        if (autoAdvanceTimeoutRef.current) {
          clearTimeout(autoAdvanceTimeoutRef.current);
        }
        autoAdvanceTimeoutRef.current = setTimeout(() => {
          handleNext();
        }, isCorrect ? 500 : 900);
      } else {
        if (feedbackTimeoutRef.current) {
          clearTimeout(feedbackTimeoutRef.current);
        }
        feedbackTimeoutRef.current = setTimeout(() => {
          setIsTransitioning(false);
        }, FEEDBACK_DELAY_MS);
      }
    },
    [
      feedback,
      isTransitioning,
      currentQuestion,
      correctShuffledIndices,
      currentItem,
      instantMode,
      sessionId,
      handleNext,
      onAnswerEvaluated,
    ]
  );

  const handleConfirm = useCallback(() => {
    if (instantMode && selectedIndices.length === 0) return;
    evaluateAnswer(selectedIndices);
  }, [instantMode, evaluateAnswer, selectedIndices]);

  const handleToggleAnswer = useCallback(
    (shuffledIndex: number) => {
      if (feedback !== null) {
        if (instantMode) {
          handleNext();
        }
        return;
      }
      if (isTransitioning || !currentQuestion) return;

      if (instantMode && !isMultiAnswer) {
        setSelectedIndices([shuffledIndex]);
        evaluateAnswer([shuffledIndex]);
        return;
      }

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
    [feedback, isTransitioning, currentQuestion, isMultiAnswer, instantMode, handleNext, evaluateAnswer]
  );

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

      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (showingPrevious) {
          setShowingPrevious(false);
          return;
        }
        if (feedback !== null) {
          handleNext();
          return;
        }
        if (!isTransitioning) {
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

  const isChunkingEnabled = Boolean(session.chunkConfig?.enabled);
  const effectiveChunkSize = session.chunkConfig?.chunkSize || 50;
  const chunks = useMemo(
    () => (isChunkingEnabled ? getChunkList(session.questions.length, effectiveChunkSize) : []),
    [isChunkingEnabled, session.questions.length, effectiveChunkSize]
  );
  const activeChunkIndex = session.chunkConfig?.activeChunkIndex ?? null;
  const activeChunk = useMemo(
    () =>
      isChunkingEnabled && activeChunkIndex !== null && activeChunkIndex >= 0 && activeChunkIndex < chunks.length
        ? chunks[activeChunkIndex]
        : null,
    [isChunkingEnabled, activeChunkIndex, chunks]
  );

  const chunkLabel = activeChunk
    ? `Część ${activeChunk.index + 1} (${activeChunk.startIndex + 1}–${activeChunk.endIndex + 1})`
    : isChunkingEnabled
    ? 'Cała baza'
    : undefined;

  const totalQuestions = activeChunk
    ? activeChunk.totalQuestions
    : session.questions.length;

  const consecutiveCorrect = optimisticStreak !== null
    ? optimisticStreak
    : (currentItem?.consecutiveCorrect ?? 0);
  const requiredStreak = currentItem?.requiredCorrectStreak ?? 1;
  const wrongCountForCurrent = optimisticWrongCount !== null
    ? optimisticWrongCount
    : (currentItem?.wrongCount ?? 0);

  const chunkQuestions = useMemo(
    () =>
      activeChunk
        ? session.questions.slice(activeChunk.startIndex, activeChunk.endIndex + 1)
        : session.questions,
    [activeChunk, session.questions]
  );

  let doneCount = activeChunk
    ? chunkQuestions.filter(q => session.done.includes(q.id)).length
    : session.done.length;
  let remainingCount = session.queue.length;

  // Optimistically update progress when correct answer is given
  if (feedback?.state === 'correct' && consecutiveCorrect >= requiredStreak) {
    doneCount += 1;
    remainingCount -= 1;
  }

  const progressPercent = totalQuestions > 0 ? (doneCount / totalQuestions) * 100 : 0;

  const isChunkCompleted = Boolean(
    activeChunk !== null &&
    session.queue.length === 0 &&
    feedback === null &&
    !isTransitioning
  );

  const canConfirm = feedback === null && !isTransitioning;

  const dismissAfk = () => {
    lastActivityRef.current = Date.now();
    setIsAfk(false);
  };

  const switchChunk = useCallback(
    async (newChunkIndex: number | null) => {
      const currentBase = processedSessionRef.current ?? sessionRef.current;
      const currentElapsed = elapsedRef.current;
      const chunkSize = currentBase.chunkConfig?.chunkSize || 50;
      const allChunks = getChunkList(currentBase.questions.length, chunkSize);

      let newQueue: SessionState['queue'];
      let newChunkConfig: ChunkConfig;

      if (newChunkIndex !== null && newChunkIndex >= 0 && newChunkIndex < allChunks.length) {
        const targetChunk = allChunks[newChunkIndex];
        newQueue = buildChunkQueue(
          currentBase.questions,
          targetChunk,
          currentBase.repeatMode,
          currentBase.done
        );
        newChunkConfig = {
          enabled: true,
          chunkSize,
          activeChunkIndex: newChunkIndex,
        };
      } else {
        // Entire test (Cała baza)
        const doneSet = new Set(currentBase.done);
        const remainingQuestions = currentBase.questions.filter(q => !doneSet.has(q.id));
        const questionsToQueue = remainingQuestions.length > 0 ? remainingQuestions : currentBase.questions;
        const shuffled = shuffle([...questionsToQueue]);
        const initialStreak = (typeof currentBase.repeatMode === 'number' && currentBase.repeatMode > 1) ? currentBase.repeatMode : 1;
        newQueue = shuffled.map(q => ({
          questionId: q.id,
          requiredCorrectStreak: initialStreak,
          consecutiveCorrect: 0,
          wrongCount: 0,
          firstAnswerWrong: false,
        }));
        newChunkConfig = {
          enabled: currentBase.chunkConfig?.enabled ?? true,
          chunkSize,
          activeChunkIndex: null,
        };
      }

      const nextQ = newQueue.length > 0 ? getQuestionForQueueItem(currentBase.questions, newQueue[0]) : null;
      const nextShuffledOrder = nextQ ? shuffleIndices(nextQ.answers.length) : [];

      const updatedSession: SessionState = {
        ...currentBase,
        elapsedSeconds: currentElapsed,
        queue: newQueue,
        currentQuestionIndex: 0,
        shuffledAnswerOrder: nextShuffledOrder,
        chunkConfig: newChunkConfig,
        phase: 'test',
      };

      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
      setFeedback(null);
      setIsTransitioning(false);
      setSelectedIndices([]);
      setOptimisticStreak(null);
      setOptimisticWrongCount(null);
      setQuestionKey(k => k + 1);
      setShowingPrevious(false);

      processedSessionRef.current = updatedSession;
      await saveSession(updatedSession, sessionId).catch(console.error);
      onSessionUpdate(updatedSession);
    },
    [sessionId, onSessionUpdate, setShowingPrevious]
  );

  const configureChunking = useCallback(
    async (newChunkSize: number | null) => {
      const currentBase = processedSessionRef.current ?? sessionRef.current;
      const currentElapsed = elapsedRef.current;

      if (newChunkSize !== null && newChunkSize > 0) {
        const allChunks = getChunkList(currentBase.questions.length, newChunkSize);
        const firstChunk = allChunks[0];
        const newQueue = firstChunk
          ? buildChunkQueue(
              currentBase.questions,
              firstChunk,
              currentBase.repeatMode,
              currentBase.done
            )
          : currentBase.queue;

        const nextQ = newQueue.length > 0 ? getQuestionForQueueItem(currentBase.questions, newQueue[0]) : null;
        const nextShuffledOrder = nextQ ? shuffleIndices(nextQ.answers.length) : [];

        const updatedSession: SessionState = {
          ...currentBase,
          elapsedSeconds: currentElapsed,
          queue: newQueue,
          currentQuestionIndex: 0,
          shuffledAnswerOrder: nextShuffledOrder,
          chunkConfig: {
            enabled: true,
            chunkSize: newChunkSize,
            activeChunkIndex: 0,
          },
          phase: 'test',
        };

        if (feedbackTimeoutRef.current) {
          clearTimeout(feedbackTimeoutRef.current);
        }
        setFeedback(null);
        setIsTransitioning(false);
        setSelectedIndices([]);
        setOptimisticStreak(null);
        setOptimisticWrongCount(null);
        setQuestionKey(k => k + 1);
        setShowingPrevious(false);

        processedSessionRef.current = updatedSession;
        await saveSession(updatedSession, sessionId).catch(console.error);
        onSessionUpdate(updatedSession);
      } else {
        const updatedSession: SessionState = {
          ...currentBase,
          elapsedSeconds: currentElapsed,
          chunkConfig: {
            enabled: false,
            chunkSize: 50,
            activeChunkIndex: null,
          },
        };
        processedSessionRef.current = updatedSession;
        await saveSession(updatedSession, sessionId).catch(console.error);
        onSessionUpdate(updatedSession);
      }
    },
    [sessionId, onSessionUpdate, setShowingPrevious]
  );

  const repeatChunk = useCallback(async () => {
    const currentBase = processedSessionRef.current ?? sessionRef.current;
    if (!currentBase.chunkConfig?.enabled || currentBase.chunkConfig.activeChunkIndex === null) {
      return;
    }
    const currentElapsed = elapsedRef.current;
    const chunkSize = currentBase.chunkConfig.chunkSize || 50;
    const allChunks = getChunkList(currentBase.questions.length, chunkSize);
    const targetChunk = allChunks[currentBase.chunkConfig.activeChunkIndex];
    if (!targetChunk) return;

    const newQueue = buildChunkQueue(
      currentBase.questions,
      targetChunk,
      currentBase.repeatMode,
      []
    );

    const nextQ = newQueue.length > 0 ? getQuestionForQueueItem(currentBase.questions, newQueue[0]) : null;
    const nextShuffledOrder = nextQ ? shuffleIndices(nextQ.answers.length) : [];

    const updatedSession: SessionState = {
      ...currentBase,
      elapsedSeconds: currentElapsed,
      queue: newQueue,
      currentQuestionIndex: 0,
      shuffledAnswerOrder: nextShuffledOrder,
      phase: 'test',
    };

    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }
    setFeedback(null);
    setIsTransitioning(false);
    setSelectedIndices([]);
    setOptimisticStreak(null);
    setOptimisticWrongCount(null);
    setQuestionKey(k => k + 1);
    setShowingPrevious(false);

    processedSessionRef.current = updatedSession;
    await saveSession(updatedSession, sessionId).catch(console.error);
    onSessionUpdate(updatedSession);
  }, [sessionId, onSessionUpdate, setShowingPrevious]);

  const finishTest = useCallback(async () => {
    const currentBase = processedSessionRef.current ?? sessionRef.current;
    const currentElapsed = elapsedRef.current;
    const updatedSession: SessionState = {
      ...currentBase,
      elapsedSeconds: currentElapsed,
      phase: 'summary',
    };
    processedSessionRef.current = updatedSession;
    await saveSession(updatedSession, sessionId).catch(console.error);
    onSessionUpdate(updatedSession);
  }, [sessionId, onSessionUpdate]);

  return {
    elapsed,
    isAfk,
    dismissAfk,
    feedback,
    isTransitioning,
    questionKey,
    shakeKey,
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
    chunks,
    activeChunkIndex,
    activeChunk,
    chunkLabel,
    isChunkCompleted,
    switchChunk,
    configureChunking,
    repeatChunk,
    finishTest,
    handleToggleAnswer,
    handleConfirm,
    handleNext,
  };
}
