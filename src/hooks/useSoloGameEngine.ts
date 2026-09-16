import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Question, AnswerFeedback } from '../models/types';
import { shuffle, shuffleIndices, findShuffledPosition } from '../utils/shuffle';
import {
  SoloGameMode,
  SoloModeRecord,
  getSoloModeRecord,
  saveSoloGameResult,
} from '../utils/arcadeStorage';
import {
  playCorrectSound,
  playWrongSound,
  playHeartLostSound,
  playTimerTickSound,
  playGameOverSound,
} from '../utils/sound';

export interface UseSoloGameEngineProps {
  mode: SoloGameMode;
  questions: Question[];
  sessionId: string;
  onExit: () => void;
}

export type GameState = 'playing' | 'game_over' | 'victory';

export interface TimeDeltaNotification {
  id: number;
  text: string;
  type: 'bonus' | 'penalty';
}

const TRANSITION_CORRECT_DELAY = 500;
const TRANSITION_WRONG_DELAY = 900;
const COMBO_MAX = 5;
const COMBO_MULTIPLIERS: Record<number, number> = {
  1: 1,
  2: 1.5,
  3: 2,
  4: 3,
  5: 5,
};

export function useSoloGameEngine({
  mode,
  questions,
  sessionId,
  onExit,
}: UseSoloGameEngineProps) {
  // Pool of questions shuffled
  const [deck, setDeck] = useState<Question[]>(() => shuffle([...questions]));
  const [questionIndex, setQuestionIndex] = useState(0);
  const [questionKey, setQuestionKey] = useState(0);

  // Game state
  const [gameState, setGameState] = useState<GameState>('playing');
  const [lives, setLives] = useState<number>(mode === 'sudden-death' ? 3 : 0);
  const [timeRemaining, setTimeRemaining] = useState<number>(mode === 'time-attack' ? 60 : 0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(1);
  const [streak, setStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [shakeKey, setShakeKey] = useState(0);
  const [timeDeltaNotification, setTimeDeltaNotification] = useState<TimeDeltaNotification | null>(null);

  // Current question interaction
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Summary stats
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [startTime] = useState<number>(() => Date.now());
  const [durationSeconds, setDurationSeconds] = useState(0);

  // High score tracking
  const [record, setRecord] = useState<SoloModeRecord>(() =>
    getSoloModeRecord(mode, sessionId)
  );
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [isNewBestStreak, setIsNewBestStreak] = useState(false);

  // Stable statsRef for handleGameOver to decouple from re-renders and timer recreation
  const statsRef = useRef({
    score: 0,
    longestStreak: 0,
    totalAnswered: 0,
    correctCount: 0,
    startTime: Date.now(),
  });
  statsRef.current = {
    score,
    longestStreak,
    totalAnswered,
    correctCount,
    startTime,
  };

  // Refs for timers & race condition prevention
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickAudioRef = useRef<number>(0);
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notificationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isGameOverPendingRef = useRef(false);
  const gameStateRef = useRef<GameState>('playing');
  gameStateRef.current = gameState;
  const lastTickTimeRef = useRef<number>(Date.now());

  // Current question data
  const currentQuestion: Question | undefined = deck[questionIndex];

  const shuffledOrder = useMemo(() => {
    if (!currentQuestion) return [];
    return shuffleIndices(currentQuestion.answers.length);
  }, [currentQuestion, questionKey]);

  const correctOriginalIndices = useMemo(() => {
    if (!currentQuestion) return [];
    if (currentQuestion.correctAnswerIndices && currentQuestion.correctAnswerIndices.length > 0) {
      return currentQuestion.correctAnswerIndices;
    }
    if (currentQuestion.correctAnswerIndex !== undefined) {
      return [currentQuestion.correctAnswerIndex];
    }
    return currentQuestion.answers
      .map((ans, idx) => (ans.isCorrect ? idx : -1))
      .filter(idx => idx !== -1);
  }, [currentQuestion]);

  const correctShuffledIndices = useMemo(() => {
    if (!currentQuestion || shuffledOrder.length === 0) return [];
    return correctOriginalIndices
      .map(origIdx => findShuffledPosition(shuffledOrder, origIdx))
      .filter(shuffledIdx => shuffledIdx !== -1);
  }, [currentQuestion, correctOriginalIndices, shuffledOrder]);

  const isMultiAnswer = correctOriginalIndices.length > 1;

  // End Game handler - stable callback reading latest statistics from statsRef
  const handleGameOver = useCallback((isVictory: boolean = false) => {
    if (gameStateRef.current !== 'playing') return;
    const finalState = isVictory ? 'victory' : 'game_over';
    setGameState(finalState);
    gameStateRef.current = finalState;
    isGameOverPendingRef.current = false;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    }
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
      notificationTimeoutRef.current = null;
    }

    const {
      score: currentScore,
      longestStreak: currentStreak,
      totalAnswered: currentAnswered,
      correctCount: currentCorrect,
      startTime: currentStartTime,
    } = statsRef.current;

    const elapsed = Math.round((Date.now() - currentStartTime) / 1000);
    setDurationSeconds(elapsed);

    // Play fanfare / game over audio
    playGameOverSound(isVictory);

    // Save record to arcade storage
    const result = saveSoloGameResult({
      mode,
      sessionId,
      score: currentScore,
      streak: currentStreak,
      totalAnswered: currentAnswered,
      correctCount: currentCorrect,
      durationSeconds: elapsed,
    });

    setIsNewHighScore(result.isNewHighScore);
    setIsNewBestStreak(result.isNewBestStreak);
    setRecord(result.record);
  }, [mode, sessionId]);

  // Notification helper
  const showTimeNotification = useCallback((text: string, type: 'bonus' | 'penalty') => {
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    setTimeDeltaNotification({ id: Date.now(), text, type });
    notificationTimeoutRef.current = setTimeout(() => {
      setTimeDeltaNotification(null);
      notificationTimeoutRef.current = null;
    }, 900);
  }, []);

  // Timer loop for Time Attack with delta timing
  useEffect(() => {
    if (mode !== 'time-attack' || gameState !== 'playing') return;

    lastTickTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      const now = Date.now();
      const delta = (now - lastTickTimeRef.current) / 1000;
      lastTickTimeRef.current = now;

      setTimeRemaining(prev => {
        const next = Math.max(0, Math.round((prev - delta) * 10) / 10);

        // Play tick sound once per second when under 10 seconds
        if (next <= 10 && next > 0) {
          const wholeSec = Math.floor(next);
          if (wholeSec !== tickAudioRef.current) {
            tickAudioRef.current = wholeSec;
            playTimerTickSound();
          }
        }

        if (next <= 0) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          isGameOverPendingRef.current = true;
          handleGameOver(false);
          return 0;
        }
        return next;
      });
    }, 100);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [mode, gameState, handleGameOver]);

  // Next Question
  const advanceToNextQuestion = useCallback(() => {
    setFeedback(null);
    setSelectedIndices([]);
    setIsTransitioning(false);

    if (questionIndex + 1 >= deck.length) {
      if (mode === 'zen') {
        // Finishing the full deck in Zen is a completion / victory
        handleGameOver(true);
      } else if (mode === 'time-attack') {
        // Loop questions with a reshuffle while time remains
        setDeck(shuffle([...questions]));
        setQuestionIndex(0);
        setQuestionKey(k => k + 1);
      } else {
        // Sudden death beaten the whole deck -> Victory!
        handleGameOver(true);
      }
    } else {
      setQuestionIndex(i => i + 1);
      setQuestionKey(k => k + 1);
    }
  }, [questionIndex, deck.length, mode, questions, handleGameOver]);

  // Check Answer
  const evaluateAnswer = useCallback((chosenIndices: number[]) => {
    if (
      feedback !== null ||
      isTransitioning ||
      !currentQuestion ||
      gameStateRef.current !== 'playing' ||
      isGameOverPendingRef.current
    ) {
      return;
    }

    const isSkip = chosenIndices.length === 0;
    const allSelectedCorrect = !isSkip && chosenIndices.every(si => correctShuffledIndices.includes(si));
    const allCorrectSelected = !isSkip && correctShuffledIndices.every(ci => chosenIndices.includes(ci));
    const isCorrect = !isSkip && allSelectedCorrect && allCorrectSelected;

    setTotalAnswered(t => t + 1);

    const newFeedback: AnswerFeedback = {
      selectedAnswerIndices: chosenIndices,
      state: isCorrect ? 'correct' : 'wrong',
      correctShuffledIndices,
    };
    setFeedback(newFeedback);
    setIsTransitioning(true);

    if (isCorrect) {
      playCorrectSound();
      setCorrectCount(c => c + 1);
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      setLongestStreak(prev => Math.max(prev, nextStreak));

      // Calculate score points with combo multiplier
      const comboMultiplier = COMBO_MULTIPLIERS[Math.min(combo, COMBO_MAX)] ?? 1;
      const speedBonus = mode === 'time-attack' ? Math.min(50, Math.floor(timeRemaining)) : 0;
      const pointsAdded = Math.round(100 * comboMultiplier + speedBonus);
      setScore(s => s + pointsAdded);

      // In Time Attack: add bonus seconds
      if (mode === 'time-attack') {
        setTimeRemaining(t => Math.min(99, Math.round((t + 3) * 10) / 10));
        showTimeNotification('+3s', 'bonus');
      }

      // Combo increase up to COMBO_MAX
      setCombo(c => Math.min(COMBO_MAX, c + 1));

      // Transition to next question
      transitionTimeoutRef.current = setTimeout(() => {
        advanceToNextQuestion();
      }, TRANSITION_CORRECT_DELAY);
    } else {
      // Wrong Answer
      playWrongSound();
      setStreak(0);
      setCombo(1);
      setShakeKey(k => k + 1);

      if (mode === 'sudden-death') {
        playHeartLostSound();
        const nextLives = lives - 1;
        setLives(nextLives);

        if (nextLives <= 0) {
          isGameOverPendingRef.current = true;
          transitionTimeoutRef.current = setTimeout(() => {
            handleGameOver(false);
          }, 600);
          return;
        }
      } else if (mode === 'time-attack') {
        // Penalty 5 seconds
        const nextTime = Math.max(0, Math.round((timeRemaining - 5) * 10) / 10);
        setTimeRemaining(nextTime);
        showTimeNotification('-5s', 'penalty');

        if (nextTime <= 0) {
          isGameOverPendingRef.current = true;
          transitionTimeoutRef.current = setTimeout(() => {
            handleGameOver(false);
          }, 300);
          return;
        }
      }

      transitionTimeoutRef.current = setTimeout(() => {
        advanceToNextQuestion();
      }, TRANSITION_WRONG_DELAY);
    }
  }, [
    feedback,
    isTransitioning,
    currentQuestion,
    correctShuffledIndices,
    streak,
    combo,
    mode,
    timeRemaining,
    advanceToNextQuestion,
    lives,
    handleGameOver,
    showTimeNotification,
  ]);

  // Toggle selection for single / multi choice
  const handleToggleAnswer = useCallback((shuffledIdx: number) => {
    if (
      feedback !== null ||
      isTransitioning ||
      !currentQuestion ||
      gameStateRef.current !== 'playing' ||
      isGameOverPendingRef.current
    ) {
      return;
    }

    if (isMultiAnswer) {
      setSelectedIndices(prev =>
        prev.includes(shuffledIdx)
          ? prev.filter(i => i !== shuffledIdx)
          : [...prev, shuffledIdx]
      );
    } else {
      // In fast arcade mode for single-choice questions, tapping the answer immediately checks it!
      setSelectedIndices([shuffledIdx]);
      evaluateAnswer([shuffledIdx]);
    }
  }, [feedback, isTransitioning, currentQuestion, isMultiAnswer, evaluateAnswer]);

  // Confirm manual button (useful for multi-answer questions or skip)
  const handleConfirm = useCallback(() => {
    if (gameStateRef.current !== 'playing' || isGameOverPendingRef.current) {
      return;
    }

    if (feedback !== null) {
      // If already in feedback, advance immediately
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
        transitionTimeoutRef.current = null;
      }
      advanceToNextQuestion();
      return;
    }
    evaluateAnswer(selectedIndices);
  }, [feedback, advanceToNextQuestion, evaluateAnswer, selectedIndices]);

  // Gracefully finish Zen mode session anytime
  const handleFinishZen = useCallback(() => {
    if (mode === 'zen' && gameStateRef.current === 'playing' && !isGameOverPendingRef.current) {
      handleGameOver(true);
    }
  }, [mode, handleGameOver]);

  // Restart game with current deck
  const handleRestart = useCallback(() => {
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    }
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
      notificationTimeoutRef.current = null;
    }

    isGameOverPendingRef.current = false;
    setTimeDeltaNotification(null);
    setDeck(shuffle([...questions]));
    setQuestionIndex(0);
    setQuestionKey(k => k + 1);
    setGameState('playing');
    gameStateRef.current = 'playing';
    setLives(mode === 'sudden-death' ? 3 : 0);
    setTimeRemaining(mode === 'time-attack' ? 60 : 0);
    setScore(0);
    setCombo(1);
    setStreak(0);
    setLongestStreak(0);
    setSelectedIndices([]);
    setFeedback(null);
    setIsTransitioning(false);
    setTotalAnswered(0);
    setCorrectCount(0);
    setDurationSeconds(0);
    setIsNewHighScore(false);
    setIsNewBestStreak(false);
    setRecord(getSoloModeRecord(mode, sessionId));
  }, [questions, mode, sessionId]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) return;

      if (e.key === 'Escape') {
        onExit();
        return;
      }

      if (
        (e.key === ' ' || e.key === 'Enter') &&
        gameStateRef.current === 'playing' &&
        !isGameOverPendingRef.current
      ) {
        e.preventDefault();
        handleConfirm();
        return;
      }

      const answerKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
      const idx = answerKeys.indexOf(e.key);
      if (
        idx !== -1 &&
        currentQuestion &&
        idx < currentQuestion.answers.length &&
        gameStateRef.current === 'playing' &&
        !isGameOverPendingRef.current
      ) {
        handleToggleAnswer(idx);
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onExit, handleConfirm, currentQuestion, handleToggleAnswer]);

  return {
    mode,
    gameState,
    lives,
    timeRemaining,
    score,
    combo,
    streak,
    longestStreak,
    shakeKey,
    timeDeltaNotification,
    currentQuestion,
    questionKey,
    questionIndex,
    totalQuestions: deck.length,
    shuffledOrder,
    selectedIndices,
    feedback,
    isTransitioning,
    isMultiAnswer,
    totalAnswered,
    correctCount,
    durationSeconds,
    record,
    isNewHighScore,
    isNewBestStreak,
    handleToggleAnswer,
    handleConfirm,
    handleFinishZen,
    handleRestart,
    handleExit: onExit,
  };
}
