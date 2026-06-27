import { useEffect, useRef, useState, useCallback, FC, ReactNode, Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { SessionState, AnswerFeedback, Question } from '../models/types';
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
import { MarkdownRenderer } from './MarkdownRenderer';
import { QuestionRenderer } from './QuestionRenderer';

interface TestViewProps {
  session: SessionState;
  sessionId: string;
  onSessionUpdate: (session: SessionState) => void;
  onQuit: () => void;
}

interface PreviousQuestionData {
  question: Question;
  shuffledOrder: number[];
  correctShuffledIndices: number[];
  feedback: AnswerFeedback;
}

// Shorter delay — user just confirmed, no need to wait long
const FEEDBACK_DELAY_MS = 150;
const ANSWER_KEYS = ['1', '2', '3', '4', '5', '6'];

export const TestView: FC<TestViewProps> = ({
  session,
  sessionId,
  onSessionUpdate,
  onQuit,
}) => {
  const { t } = useTranslation();
  const [elapsed, setElapsed] = useState(session.elapsedSeconds);
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [questionKey, setQuestionKey] = useState(0);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [processedSession, setProcessedSession] = useState<SessionState | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [optimisticStreak, setOptimisticStreak] = useState<number | null>(null);
  const [optimisticWrongCount, setOptimisticWrongCount] = useState<number | null>(null);
  const [isSingleAnswerRevealed, setIsSingleAnswerRevealed] = useState(false);
  const [previousQuestion, setPreviousQuestion] = useState<PreviousQuestionData | null>(null);
  const [showingPrevious, setShowingPrevious] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    };
  }, []);
  const sessionRef = useRef(session);
  sessionRef.current = session;
  const elapsedRef = useRef(elapsed);
  elapsedRef.current = elapsed;
  // Keep a ref to the latest processed session so the unmount cleanup
  // doesn't overwrite a completed session with the stale prop.
  const processedSessionRef = useRef<SessionState | null>(null);

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
    if (currentQuestion && feedback) {
      setPreviousQuestion({
        question: currentQuestion,
        shuffledOrder: shuffledOrder,
        correctShuffledIndices: correctShuffledIndices,
        feedback: feedback,
      });
    }

    setFeedback(null);
    setSelectedIndices([]);
    setOptimisticStreak(null);
    setOptimisticWrongCount(null);
    setIsSingleAnswerRevealed(false);
    setQuestionKey(k => k + 1);
    setShowingPrevious(false);
    if (processedSession) {
      processedSessionRef.current = processedSession;
      onSessionUpdate(processedSession);
      setProcessedSession(null);
    }
  }, [processedSession, onSessionUpdate, currentQuestion, feedback, shuffledOrder, correctShuffledIndices]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [questionKey]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      )
        return;

      if (e.key === 'Escape') {
        if (showingPrevious) {
          setShowingPrevious(false);
        } else {
          setConfirmQuit(q => !q);
        }
        return;
      }

      if (e.key === 'ArrowLeft' && previousQuestion) {
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
  }, [handleToggleAnswer, handleConfirm, handleNext, currentQuestion, feedback, isTransitioning, showingPrevious, previousQuestion]);

  const totalQuestions = session.questions.length;
  const doneCount = session.done.length;
  const remainingCount = session.queue.length;
  const progressPercent =
    totalQuestions > 0 ? (doneCount / totalQuestions) * 100 : 0;

  const consecutiveCorrect = optimisticStreak !== null
    ? optimisticStreak
    : (currentItem?.consecutiveCorrect ?? 0);
  const requiredStreak = currentItem?.requiredCorrectStreak ?? 1;
  const wrongCountForCurrent = optimisticWrongCount !== null
    ? optimisticWrongCount
    : (currentItem?.wrongCount ?? 0);
    
  const hasOnlyOneAnswer = currentQuestion?.answers.length === 1;

  if (!currentQuestion || !currentItem) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full border-4 border-primary-200 border-t-blue-600 animate-spin mx-auto" />
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">{t('test.loading')}</p>
        </div>
      </div>
    );
  }

  const getAnswerButtonClass = (shuffledIdx: number): string => {
    const base =
      'group w-full text-left px-5 py-4 rounded-xl border-2 font-medium text-sm transition-all duration-200 select-none leading-relaxed focus:outline-none';

    if (feedback === null) {
      const isSelected = selectedIndices.includes(shuffledIdx);
      if (isSelected) {
        return `${base} border-primary-500 bg-primary-50/80 dark:bg-primary-900/30 text-primary-900 dark:text-primary-100 shadow-sm cursor-pointer`;
      }
      return `${base} border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/60 text-zinc-800 dark:text-zinc-200 hover:border-primary-400 dark:hover:border-primary-500 hover:bg-primary-50/60 dark:hover:bg-primary-900/20 hover:shadow-sm cursor-pointer active:scale-[0.99]`;
    }

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

  const getAnswerBadge = (shuffledIdx: number): ReactNode => {
    if (feedback === null) {
      const isSelected = selectedIndices.includes(shuffledIdx);
      if (isMultiAnswer) {
        return (
          <span
            className={`w-7 h-7 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
              isSelected
                ? 'bg-primary-500 border-primary-500'
                : 'border-zinc-300 dark:border-zinc-600 group-hover:border-primary-400 dark:group-hover:border-primary-500'
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
      return (
        <span
          className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${
            isSelected
              ? 'bg-primary-500 border-primary-500 text-white'
              : 'border-zinc-300 dark:border-zinc-600 group-hover:border-primary-400 dark:group-hover:border-primary-500 text-zinc-400 dark:text-zinc-500 group-hover:text-primary-500'
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

  const renderStreakDots = () => {
    if (requiredStreak <= 1) return null;
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
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
          {t('test.streak')}
        </span>
      </div>
    );
  };

  const canConfirm = feedback === null && !isTransitioning;

  return (
    <div className="flex-1 bg-zinc-50 dark:bg-zinc-950 flex flex-col">

      <header className="sticky top-0 z-20 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-zinc-900">
        <div className="max-w-5xl mx-auto px-4 py-3">

          <div className="flex items-center justify-between gap-4 mb-2.5">

            <div className="flex items-center gap-2">
              {confirmQuit ? (
                <>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 mr-1">
                    {t('test.quitConfirmPrompt')}
                  </span>
                  <Button size="sm" variant="danger" onClick={onQuit}>
                    {t('test.yes')}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setConfirmQuit(false)}
                  >
                    {t('test.no')}
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
                  {t('test.quit')}
                </Button>
              )}
            </div>

            <div className="flex items-center gap-3 flex-wrap justify-end">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {t('test.completed')}{' '}
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
      <main className="flex-1 flex items-start px-4 py-8 pb-16">
        <div className="w-full max-w-5xl mx-auto flex gap-6 items-stretch">

          {/* ── Left column: question + answers ──────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-4">

            {/* Question metadata row */}
            <div className="flex items-center justify-between flex-wrap gap-2 animate-fadeIn">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="info">
                  {t('test.remaining', { count: remainingCount })}
                </Badge>

                {isMultiAnswer && (
                  <Badge variant="warning">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {t('test.multipleCorrect')}
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
                    {t('test.errors', { count: wrongCountForCurrent })}
                  </Badge>
                )}
              </div>
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
                <QuestionRenderer 
                  text={currentQuestion.text} 
                  sourceFile={currentQuestion.sourceFile} 
                  sessionId={sessionId} 
                />
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
                      {t('test.correctAnswer')}
                      {requiredStreak > 1 && consecutiveCorrect < requiredStreak && (
                        <span className="font-normal text-emerald-700 dark:text-emerald-400 ml-1">
                          {t('test.moreToPass', { count: requiredStreak - consecutiveCorrect })}
                        </span>
                      )}
                      {requiredStreak > 1 && consecutiveCorrect >= requiredStreak && (
                        <span className="font-normal ml-1">{t('test.questionPassed')}</span>
                      )}
                    </span>
                  </>
                ) : feedback.selectedAnswerIndices.length === 0 ? (
                  <>
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                    <span>{t('test.skipped')}</span>
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
                      {t('test.wrongAnswerPrefix')}
                      <strong>{session.repeatMode}</strong>{' '}
                      {t('test.wrongAnswerSuffix', { count: session.repeatMode })}
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
                const isHiddenSingle = hasOnlyOneAnswer && !isSingleAnswerRevealed && feedback === null;
                
                return (
                  <button
                    key={answer.id}
                    onClick={() => {
                      if (isHiddenSingle) {
                        setIsSingleAnswerRevealed(true);
                      } else {
                        handleToggleAnswer(shuffledIdx);
                      }
                    }}
                    onMouseEnter={() => {
                      if (isHiddenSingle) setIsSingleAnswerRevealed(true);
                    }}
                    onFocus={() => {
                      if (isHiddenSingle) setIsSingleAnswerRevealed(true);
                    }}
                    disabled={feedback !== null || isTransitioning}
                    className={getAnswerButtonClass(shuffledIdx)}
                  >
                    <div className="flex items-start gap-3">
                      {getAnswerBadge(shuffledIdx)}
                      <div className={`pt-0.5 flex-1 text-left transition-all duration-300 ${isHiddenSingle ? 'text-transparent bg-zinc-300 dark:bg-zinc-700 rounded-md select-none opacity-50' : ''}`}>
                        {isHiddenSingle ? t('test.hoverToReveal') : <MarkdownRenderer content={answer.text} className="[&>p]:mb-0" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Keyboard hint */}
            <div className="flex items-center justify-center gap-2 pt-1">
              <p className="text-center text-xs text-zinc-400 dark:text-zinc-600">
                {t('test.keyboard')}{' '}
                {currentQuestion.answers.map((_, i) => (
                  <Fragment key={i}>
                    <kbd className="bg-zinc-200 dark:bg-zinc-700/80 px-1.5 py-0.5 rounded text-xs font-mono mx-0.5">
                      {ANSWER_KEYS[i]}
                    </kbd>
                  </Fragment>
                ))}
                — {isMultiAnswer ? t('test.mark') : t('test.select')} &nbsp;|&nbsp;{' '}
                <kbd className="bg-zinc-200 dark:bg-zinc-700/80 px-1.5 py-0.5 rounded text-xs font-mono mx-0.5">
                  {t('test.space')}
                </kbd>{' '}
                — {feedback ? t('test.nextShort') : t('test.confirmShort')}
                {previousQuestion && (
                  <>
                    {' '}&nbsp;|&nbsp;{' '}
                    <kbd className="bg-zinc-200 dark:bg-zinc-700/80 px-1.5 py-0.5 rounded text-xs font-mono mx-0.5">
                      ←
                    </kbd>{' '}
                    — {t('test.previousShort')}
                  </>
                )}
              </p>
            </div>

          </div>

          {/* ── Right sidebar: actions ────────────────────────────────────────── */}
          <div className="w-52 flex-shrink-0 flex flex-col justify-center gap-3">

            {/* Streak indicator */}
            {requiredStreak > 1 && (
              <div className="bg-white dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700 px-4 py-3">
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-2 font-medium uppercase tracking-wide">
                  {t('test.streakTitle')}
                </p>
                {renderStreakDots()}
              </div>
            )}

            {/* Primary action button */}
            <div className="space-y-2">
              {feedback === null && !isTransitioning && (
                <Button
                  onClick={handleConfirm}
                  variant="primary"
                  size="lg"
                  disabled={!canConfirm}
                  className={`w-full animate-fadeIn transition-all shadow-xl shadow-primary-600/20 ${
                    selectedIndices.length === 0 ? 'opacity-60' : ''
                  }`}
                >
                  {selectedIndices.length === 0 ? (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                      {t('test.skipBtn')}
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      {t('test.confirmBtn')}
                    </>
                  )}
                </Button>
              )}

              {feedback !== null && !isTransitioning && (
                <Button
                  onClick={handleNext}
                  variant="primary"
                  size="lg"
                  className="w-full animate-fadeIn shadow-xl shadow-primary-600/20"
                >
                  {t('test.nextBtn')}
                </Button>
              )}
            </div>

            {/* Previous question button */}
            {previousQuestion && (
              <button
                onClick={() => setShowingPrevious(true)}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all duration-150 text-sm font-medium"
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
                <span>{t('test.prevQuestion')}</span>
              </button>
            )}

          </div>

        </div>
      </main>

      {/* ── Previous question overlay ─────────────────────────────────────────── */}
      {showingPrevious && previousQuestion && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setShowingPrevious(false)}
        >
          <div
            className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-700 w-full max-w-xl max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
                <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  {t('test.prevQuestion')}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {/* Result badge */}
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    previousQuestion.feedback.state === 'correct'
                      ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400'
                      : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400'
                  }`}
                >
                  {previousQuestion.feedback.state === 'correct' ? t('test.resultCorrect') : previousQuestion.feedback.selectedAnswerIndices.length === 0 ? t('test.resultSkipped') : t('test.resultWrong')}
                </span>
                <button
                  onClick={() => setShowingPrevious(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Question text */}
            <div className="px-6 py-4">
              <div className="text-base font-semibold text-zinc-900 dark:text-zinc-50 leading-relaxed">
                <QuestionRenderer 
                  text={previousQuestion.question.text} 
                  sourceFile={previousQuestion.question.sourceFile} 
                  sessionId={sessionId} 
                />
              </div>
            </div>

            {/* Answers (read-only with result indicators) */}
            <div className="px-6 pb-6 space-y-2">
              {previousQuestion.shuffledOrder.map((originalIdx, shuffledIdx) => {
                const answer = previousQuestion.question.answers[originalIdx];
                const isCorrect = previousQuestion.correctShuffledIndices.includes(shuffledIdx);
                const wasSelected = previousQuestion.feedback.selectedAnswerIndices.includes(shuffledIdx);

                let cls = 'flex items-start gap-3 px-4 py-3 rounded-xl border-2 text-sm ';
                let badgeEl: ReactNode;

                if (isCorrect) {
                  cls += 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-200';
                  badgeEl = (
                    <span className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </span>
                  );
                } else if (wasSelected && !isCorrect) {
                  cls += 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200';
                  badgeEl = (
                    <span className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </span>
                  );
                } else {
                  cls += 'border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 text-zinc-400 dark:text-zinc-600';
                  badgeEl = (
                    <span className="w-6 h-6 rounded-full border-2 border-zinc-200 dark:border-zinc-700 flex-shrink-0 mt-0.5" />
                  );
                }

                return (
                  <div key={answer.id} className={cls}>
                    {badgeEl}
                    <div className="flex-1 leading-relaxed"><MarkdownRenderer content={answer.text} className="[&>p]:mb-0" /></div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
