import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SessionState, AnswerFeedback } from '../models/types';
import {
  processCorrectAnswer,
  processWrongAnswer,
  getQuestionForQueueItem,
  saveSession,
  formatTime,
} from '../utils/session';
import { findShuffledPosition } from '../utils/shuffle';
import { ProgressBar } from './ui/ProgressBar';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

interface TestViewProps {
  session: SessionState;
  sessionId: string;
  onSessionUpdate: (session: SessionState) => void;
  onQuit: () => void;
}

// Shorter delay — user just confirmed, no need to wait long
const FEEDBACK_DELAY_MS = 150;
const ANSWER_KEYS = ['1', '2', '3', '4', '5', '6'];

export const TestView: React.FC<TestViewProps> = ({
  session,
  sessionId,
  onSessionUpdate,
  onQuit,
}) => {
  const [elapsed, setElapsed] = useState(session.elapsedSeconds);
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [questionKey, setQuestionKey] = useState(0);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [processedSession, setProcessedSession] = useState<SessionState | null>(null);
  // Selected answers (before confirming) — array of shuffled indices
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  // Optimistic streak: shown immediately after confirm, before session update
  const [optimisticStreak, setOptimisticStreak] = useState<number | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionRef = useRef(session);
  sessionRef.current = session;
  const elapsedRef = useRef(elapsed);
  elapsedRef.current = elapsed;
  // Keep a ref to the latest processed session so the unmount cleanup
  // doesn't overwrite a completed session with the stale prop.
  const processedSessionRef = useRef<SessionState | null>(null);

  // ─── Timer ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!sessionId) return;

    timerRef.current = setInterval(() => {
      setElapsed(prev => {
        const next = prev + 1;
        if (next % 5 === 0) {
          const updated = { ...sessionRef.current, elapsedSeconds: next };
          saveSession(updated, sessionId);
        }
        return next;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      // On unmount: use the most recently processed session if available.
      // This prevents overwriting a completed (phase=summary) session with
      // the stale session prop when TestView unmounts after the last question.
      const finalBase = processedSessionRef.current ?? sessionRef.current;
      const updated = { ...finalBase, elapsedSeconds: elapsedRef.current };
      saveSession(updated, sessionId);
    };
  }, [sessionId]);

  // ─── Current question ─────────────────────────────────────────────────────

  const currentItem = session.queue[session.currentQuestionIndex];
  const currentQuestion = getQuestionForQueueItem(session.questions, currentItem);
  const shuffledOrder = session.shuffledAnswerOrder;

  // How many correct answers does the question have?
  const correctOriginalIndices: number[] = currentQuestion
    ? (currentQuestion.correctAnswerIndices ?? [currentQuestion.correctAnswerIndex])
    : [];

  const isMultiAnswer = correctOriginalIndices.length > 1;

  // All correct shuffled positions for this question
  const correctShuffledIndices: number[] = correctOriginalIndices.map(origIdx =>
    findShuffledPosition(shuffledOrder, origIdx)
  );

  // ─── Toggle answer selection ───────────────────────────────────────────────

  const handleToggleAnswer = useCallback(
    (shuffledIndex: number) => {
      if (feedback !== null || isTransitioning || !currentQuestion) return;

      setSelectedIndices(prev => {
        if (isMultiAnswer) {
          // Multi-answer: toggle
          return prev.includes(shuffledIndex)
            ? prev.filter(i => i !== shuffledIndex)
            : [...prev, shuffledIndex];
        } else {
          // Single-answer: replace (click again to deselect)
          return prev.includes(shuffledIndex) ? [] : [shuffledIndex];
        }
      });
    },
    [feedback, isTransitioning, currentQuestion, isMultiAnswer]
  );

  // ─── Confirm selected answers ──────────────────────────────────────────────

  const handleConfirm = useCallback(() => {
    if (feedback !== null || isTransitioning || !currentQuestion) return;

    // Allow confirm with NO selection (skip / mark as wrong)
    const isSkip = selectedIndices.length === 0;

    // Determine correctness: all selected must be correct AND all correct must be selected
    const allSelectedCorrect = !isSkip && selectedIndices.every(si =>
      correctShuffledIndices.includes(si)
    );
    const allCorrectSelected = !isSkip && correctShuffledIndices.every(ci =>
      selectedIndices.includes(ci)
    );
    const isCorrect = !isSkip && allSelectedCorrect && allCorrectSelected;

    // Optimistic streak update — show immediately in UI
    if (isCorrect) {
      setOptimisticStreak((currentItem?.consecutiveCorrect ?? 0) + 1);
    } else {
      setOptimisticStreak(0);
    }

    setFeedback({
      selectedAnswerIndices: selectedIndices,
      state: isCorrect ? 'correct' : 'wrong',
      correctShuffledIndices,
    });
    setIsTransitioning(true);

    setTimeout(() => {
      const currentElapsed = elapsedRef.current;
      const baseSession = { ...sessionRef.current, elapsedSeconds: currentElapsed };
      const updatedSession = isCorrect
        ? processCorrectAnswer(baseSession)
        : processWrongAnswer(baseSession);

      saveSession(updatedSession, sessionId);
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
    setFeedback(null);
    setSelectedIndices([]);
    setOptimisticStreak(null);
    setQuestionKey(k => k + 1);
    if (processedSession) {
      // Store in ref BEFORE calling onSessionUpdate, which may unmount this component.
      processedSessionRef.current = processedSession;
      onSessionUpdate(processedSession);
      setProcessedSession(null);
    }
  }, [processedSession, onSessionUpdate]);

  // ─── Keyboard shortcuts ────────────────────────────────────────────────────

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      )
        return;

      if (e.key === 'Escape') {
        setConfirmQuit(q => !q);
        return;
      }

      // Space or Enter: confirm (even without selection = skip) or advance
      if ((e.key === ' ' || e.key === 'Enter') && !isTransitioning) {
        if (feedback !== null) {
          handleNext();
        } else {
          handleConfirm();
        }
        return;
      }

      const idx = ANSWER_KEYS.indexOf(e.key);
      if (idx !== -1 && idx < (currentQuestion?.answers.length ?? 0) && feedback === null) {
        handleToggleAnswer(idx);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleToggleAnswer, handleConfirm, handleNext, currentQuestion, feedback, isTransitioning]);

  // ─── Derived stats ────────────────────────────────────────────────────────

  const totalQuestions = session.questions.length;
  const doneCount = session.done.length;
  const remainingCount = session.queue.length; // questions left to complete
  const progressPercent =
    totalQuestions > 0 ? (doneCount / totalQuestions) * 100 : 0;

  // Use optimistic streak for immediate UI feedback, fall back to session state
  const consecutiveCorrect = optimisticStreak !== null
    ? optimisticStreak
    : (currentItem?.consecutiveCorrect ?? 0);
  const requiredStreak = currentItem?.requiredCorrectStreak ?? 1;
  const wrongCountForCurrent = currentItem?.wrongCount ?? 0;

  // ─── Guard: no question available ────────────────────────────────────────

  if (!currentQuestion || !currentItem) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin mx-auto" />
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">Ładowanie pytania…</p>
        </div>
      </div>
    );
  }

  // ─── Styling helpers ──────────────────────────────────────────────────────

  const getAnswerButtonClass = (shuffledIdx: number): string => {
    const base =
      'group w-full text-left px-5 py-4 rounded-xl border-2 font-medium text-sm transition-all duration-200 select-none leading-relaxed focus:outline-none';

    if (feedback === null) {
      const isSelected = selectedIndices.includes(shuffledIdx);
      if (isSelected) {
        return `${base} border-blue-500 bg-blue-50/80 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 shadow-sm cursor-pointer`;
      }
      return `${base} border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/60 text-zinc-800 dark:text-zinc-200 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/60 dark:hover:bg-blue-900/20 hover:shadow-sm cursor-pointer active:scale-[0.99]`;
    }

    // After confirmation — show results
    const isCorrectAnswer = feedback.correctShuffledIndices.includes(shuffledIdx);
    const isSelectedAnswer = feedback.selectedAnswerIndices.includes(shuffledIdx);

    if (isCorrectAnswer) {
      return `${base} border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 shadow-sm cursor-default`;
    }

    if (isSelectedAnswer && !isCorrectAnswer) {
      return `${base} border-red-500 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 shadow-sm cursor-default`;
    }

    return `${base} border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 text-zinc-400 dark:text-zinc-600 opacity-50 cursor-default`;
  };

  const getAnswerBadge = (shuffledIdx: number): React.ReactNode => {
    if (feedback === null) {
      const isSelected = selectedIndices.includes(shuffledIdx);
      if (isMultiAnswer) {
        // Checkbox style for multi-answer
        return (
          <span
            className={`w-7 h-7 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
              isSelected
                ? 'bg-blue-500 border-blue-500'
                : 'border-zinc-300 dark:border-zinc-600 group-hover:border-blue-400 dark:group-hover:border-blue-500'
            }`}
          >
            {isSelected && (
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            )}
          </span>
        );
      }
      // Radio style for single-answer
      return (
        <span
          className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${
            isSelected
              ? 'bg-blue-500 border-blue-500 text-white'
              : 'border-zinc-300 dark:border-zinc-600 group-hover:border-blue-400 dark:group-hover:border-blue-500 text-zinc-400 dark:text-zinc-500 group-hover:text-blue-500'
          }`}
        >
          {!isSelected && ANSWER_KEYS[shuffledIdx]}
        </span>
      );
    }

    const isCorrectAnswer = feedback.correctShuffledIndices.includes(shuffledIdx);
    const isSelectedAnswer = feedback.selectedAnswerIndices.includes(shuffledIdx);

    if (isCorrectAnswer) {
      return (
        <span className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 shadow">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </span>
      );
    }

    if (isSelectedAnswer && !isCorrectAnswer) {
      return (
        <span className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 shadow">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </span>
      );
    }

    return (
      <span className="w-7 h-7 rounded-full border-2 border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300 dark:text-zinc-700 flex-shrink-0">
        {ANSWER_KEYS[shuffledIdx]}
      </span>
    );
  };

  // ─── Streak dots ──────────────────────────────────────────────────────────

  const renderStreakDots = () => {
    if (requiredStreak <= 1) return null;
    return (
      <div className="flex items-center gap-1.5">
        {Array.from({ length: requiredStreak }, (_, i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              i < consecutiveCorrect
                ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50 scale-110'
                : 'bg-zinc-300 dark:bg-zinc-600'
            }`}
          />
        ))}
        <span className="text-xs text-zinc-500 dark:text-zinc-400 ml-1">
          streak
        </span>
      </div>
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  // Confirm is always available (even without selection = skip)
  const canConfirm = feedback === null && !isTransitioning;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">

      {/* ── Sticky Header ────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-zinc-900">
        <div className="max-w-3xl mx-auto px-4 py-3">

          {/* Top row: quit | stats | timer */}
          <div className="flex items-center justify-between gap-4 mb-2.5">

            {/* Quit controls */}
            <div className="flex items-center gap-2">
              {confirmQuit ? (
                <>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 mr-1">
                    Zakończyć?
                  </span>
                  <Button size="sm" variant="danger" onClick={onQuit}>
                    Tak
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setConfirmQuit(false)}
                  >
                    Nie
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setConfirmQuit(true)}
                  className="text-zinc-500 dark:text-zinc-400"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
                    />
                  </svg>
                  Zakończ
                </Button>
              )}
            </div>

            {/* Live stats */}
            <div className="flex items-center gap-3 flex-wrap justify-end">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Zaliczone:{' '}
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {doneCount}
                </span>
                /{totalQuestions}
              </span>

              {/* Timer */}
              <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-xl">
                <svg
                  className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="font-mono text-sm font-bold text-zinc-700 dark:text-zinc-200 tabular-nums">
                  {formatTime(elapsed)}
                </span>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <ProgressBar value={progressPercent} size="sm" color="emerald" />
        </div>
      </header>

      {/* ── Main Content ─────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center px-4 py-8 pb-16">
        <div className="w-full max-w-2xl space-y-5">

          {/* Question metadata row */}
          <div className="flex items-center justify-between flex-wrap gap-2 animate-fadeIn">
            <div className="flex items-center gap-2 flex-wrap">
              {/* "Do końca: X pytań" instead of "Pytanie X / Y" */}
              <Badge variant="info">
                Do końca: {remainingCount} {remainingCount === 1 ? 'pytanie' : remainingCount < 5 ? 'pytania' : 'pytań'}
              </Badge>

              {isMultiAnswer && (
                <Badge variant="warning">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Wiele poprawnych
                </Badge>
              )}

              {wrongCountForCurrent > 0 && (
                <Badge variant="warning">
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                    />
                  </svg>
                  Błędy: {wrongCountForCurrent}
                </Badge>
              )}
            </div>

            {/* Streak indicator */}
            {renderStreakDots()}
          </div>

          {/* Question card */}
          <Card
            key={`q-${questionKey}`}
            className="animate-fadeIn"
          >
            {/* Source file label */}
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-600 font-mono mb-3">
              <svg
                className="w-3 h-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                />
              </svg>
              <span className="truncate">
                {currentQuestion.sourceFile.split('/').pop()?.replace('.txt', '') ??
                  currentItem.questionId}
              </span>
            </div>

            {/* Question text */}
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 leading-relaxed">
              {currentQuestion.text}
            </h2>
          </Card>

          {/* Feedback banner */}
          {feedback && (
            <div
              className={`
                rounded-xl px-4 py-3 flex items-center gap-3 text-sm font-semibold
                animate-slideDown border
                ${
                  feedback.state === 'correct'
                    ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                    : 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800/60'
                }
              `}
            >
              {feedback.state === 'correct' ? (
                <>
                  <svg
                    className="w-5 h-5 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>
                    Poprawna odpowiedź!
                    {requiredStreak > 1 && consecutiveCorrect < requiredStreak && (
                      <span className="font-normal text-emerald-700 dark:text-emerald-400 ml-1">
                        Jeszcze{' '}
                        {requiredStreak - consecutiveCorrect} do zaliczenia.
                      </span>
                    )}
                    {requiredStreak > 1 && consecutiveCorrect >= requiredStreak && (
                      <span className="font-normal ml-1">Pytanie zaliczone! 🎉</span>
                    )}
                  </span>
                </>
              ) : feedback.selectedAnswerIndices.length === 0 ? (
                <>
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                  <span>Pominięto. Pytanie wróci do kolejki.</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>
                    Błędna odpowiedź. Pytanie wróci do kolejki i będzie wymagać{' '}
                    <strong>{session.repeatMode}</strong>{' '}
                    {session.repeatMode === 1
                      ? 'poprawnej odpowiedzi.'
                      : 'kolejnych poprawnych odpowiedzi.'}
                  </span>
                </>
              )}
            </div>
          )}

          {/* Answer buttons */}
          <div
            key={`answers-${questionKey}`}
            className="space-y-3 animate-fadeIn"
          >
            {shuffledOrder.map((originalIdx, shuffledIdx) => {
              const answer = currentQuestion.answers[originalIdx];
              return (
                <button
                  key={answer.id}
                  onClick={() => handleToggleAnswer(shuffledIdx)}
                  disabled={feedback !== null || isTransitioning}
                  className={getAnswerButtonClass(shuffledIdx)}
                >
                  <div className="flex items-start gap-3">
                    {getAnswerBadge(shuffledIdx)}
                    <span className="pt-0.5 flex-1 text-left">{answer.text}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Keyboard hint */}
          <div className="flex items-center justify-center gap-2 pt-2">
            <p className="text-center text-xs text-zinc-400 dark:text-zinc-600">
              Klawiatura:{' '}
              {currentQuestion.answers.map((_, i) => (
                <React.Fragment key={i}>
                  <kbd className="bg-zinc-200 dark:bg-zinc-700/80 px-1.5 py-0.5 rounded text-xs font-mono mx-0.5">
                    {ANSWER_KEYS[i]}
                  </kbd>
                </React.Fragment>
              ))}
              — {isMultiAnswer ? 'zaznacz' : 'wybierz'} &nbsp;|&nbsp;{' '}
              <kbd className="bg-zinc-200 dark:bg-zinc-700/80 px-1.5 py-0.5 rounded text-xs font-mono mx-0.5">
                Spacja
              </kbd>{' '}
              — {feedback ? 'dalej' : 'zatwierdź'} &nbsp;|&nbsp;{' '}
              <kbd className="bg-zinc-200 dark:bg-zinc-700/80 px-1.5 py-0.5 rounded text-xs font-mono">
                Esc
              </kbd>{' '}
              — zakończ
            </p>
          </div>

          {/* Action buttons: Confirm or Next */}
          <div className="flex justify-center gap-3 pt-4">
            {feedback === null && !isTransitioning && (
              <Button
                onClick={handleConfirm}
                variant="primary"
                size="lg"
                disabled={!canConfirm}
                className={`animate-fadeIn transition-all shadow-xl shadow-blue-600/20 ${
                  selectedIndices.length === 0 ? 'opacity-60' : ''
                }`}
              >
                {selectedIndices.length === 0 ? (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                    Pomiń
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    Zatwierdź
                  </>
                )}
              </Button>
            )}

            {feedback !== null && !isTransitioning && (
              <Button
                onClick={handleNext}
                variant="primary"
                size="lg"
                className="animate-fadeIn shadow-xl shadow-blue-600/20"
              >
                Dalej →
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
