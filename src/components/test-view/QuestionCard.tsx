import { type FC, ReactNode, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Layers, AlertCircle, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { QuestionRenderer } from '../QuestionRenderer';
import { Question, AnswerFeedback } from '../../models/types';
import { QuestionNoteEditor } from './QuestionNoteEditor';

interface QuestionCardProps {
  questionKey: number;
  currentQuestion: Question | undefined;
  sessionId: string;
  remainingCount: number;
  isMultiAnswer: boolean;
  wrongCountForCurrent: number;
  shuffledOrder: number[];
  selectedIndices: number[];
  feedback: AnswerFeedback | null;
  onToggleAnswer: (idx: number) => void;
  hideNavigationHints?: boolean;
}

const ANSWER_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

const QuestionCardComponent: FC<QuestionCardProps> = ({
  questionKey,
  currentQuestion,
  sessionId,
  remainingCount,
  isMultiAnswer,
  wrongCountForCurrent,
  shuffledOrder,
  selectedIndices,
  feedback,
  onToggleAnswer,
  hideNavigationHints = false,
}) => {
  const { t } = useTranslation();

  const getAnswerButtonClass = (shuffledIdx: number): string => {
    const base =
      'group relative w-full text-left px-5 py-4 rounded-2xl border-2 font-medium text-sm transition-all duration-150 select-none leading-relaxed focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900';

    if (feedback === null) {
      const isSelected = selectedIndices.includes(shuffledIdx);
      if (isSelected) {
        return `${base} border-primary-500 bg-primary-50/80 dark:bg-primary-900/30 text-primary-900 dark:text-primary-100 shadow-sm cursor-pointer ring-2 ring-primary-500/20`;
      }
      return `${base} border-zinc-200/90 dark:border-zinc-700/80 bg-white dark:bg-zinc-800/60 text-zinc-800 dark:text-zinc-200 hover:border-primary-400 dark:hover:border-primary-500 hover:bg-primary-50/50 dark:hover:bg-primary-900/20 hover:shadow-sm cursor-pointer`;
    }

    const isCorrectAnswer = feedback.correctShuffledIndices.includes(shuffledIdx);
    const isSelectedAnswer = feedback.selectedAnswerIndices.includes(shuffledIdx);

    if (isCorrectAnswer) {
      return `${base} border-emerald-500 bg-emerald-50/90 dark:bg-emerald-900/30 text-emerald-900 dark:text-emerald-100 shadow-sm cursor-default ring-2 ring-emerald-500/25`;
    }

    if (isSelectedAnswer && !isCorrectAnswer) {
      return `${base} border-rose-500 bg-rose-50/90 dark:bg-rose-900/30 text-rose-900 dark:text-rose-100 shadow-sm cursor-default ring-2 ring-rose-500/25`;
    }

    return `${base} border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/40 dark:bg-zinc-900/30 text-zinc-400 dark:text-zinc-600 opacity-40 cursor-default`;
  };

  const getAnswerBadge = (shuffledIdx: number): ReactNode => {
    if (feedback === null) {
      const isSelected = selectedIndices.includes(shuffledIdx);
      if (isMultiAnswer) {
        return (
          <div
            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 text-xs font-bold transition-all ${
              isSelected
                ? 'bg-primary-500 border-primary-500 text-white shadow-xs'
                : 'border-zinc-300 dark:border-zinc-600 group-hover:border-primary-400 dark:group-hover:border-primary-500 text-zinc-400 dark:text-zinc-500 group-hover:text-primary-500'
            }`}
          >
            {isSelected ? (
              <motion.svg
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', bounce: 0.2, duration: 0.25 }}
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </motion.svg>
            ) : (
              ANSWER_KEYS[shuffledIdx]
            )}
          </div>
        );
      } else {
        return (
          <div
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
              isSelected
                ? 'border-primary-500 text-primary-500'
                : 'border-zinc-300 dark:border-zinc-600 group-hover:border-primary-400 dark:group-hover:border-primary-500 text-zinc-400 dark:text-zinc-500 group-hover:text-primary-500'
            }`}
          >
            {isSelected ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', bounce: 0.2, duration: 0.25 }}
                className="w-2.5 h-2.5 rounded-full bg-primary-500 shadow-xs"
              />
            ) : (
              ANSWER_KEYS[shuffledIdx]
            )}
          </div>
        );
      }
    }

    const isCorrectAnswer = feedback.correctShuffledIndices.includes(shuffledIdx);
    const isSelectedAnswer = feedback.selectedAnswerIndices.includes(shuffledIdx);

    if (isCorrectAnswer) {
      return (
        <motion.span
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', bounce: 0.25, duration: 0.35 }}
          className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 shadow mt-0.5"
        >
          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </motion.span>
      );
    }
    if (isSelectedAnswer && !isCorrectAnswer) {
      return (
        <motion.span
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', bounce: 0.25, duration: 0.35 }}
          className="w-6 h-6 rounded-full bg-rose-500 flex items-center justify-center flex-shrink-0 shadow mt-0.5"
        >
          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </motion.span>
      );
    }
    return (
      <span className="w-6 h-6 rounded-full border-2 border-zinc-200 dark:border-zinc-700 flex items-center justify-center flex-shrink-0 mt-0.5" />
    );
  };

  if (!currentQuestion) return null;

  return (
    <div className="flex-1 w-full min-w-0 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2 animate-fadeIn">
        <div className="flex items-center gap-2">
          {currentQuestion.sourceFile && (
            <Badge variant="info" className="text-zinc-500 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
              <FileText className="w-3 h-3 text-zinc-400" />
              <span className="truncate max-w-[200px]" title={currentQuestion.sourceFile}>
                {currentQuestion.sourceFile}
              </span>
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Badge variant="default">
            {t('test.remaining', { count: remainingCount })}
          </Badge>
          {isMultiAnswer && (
            <Badge variant="warning">
              <Layers className="w-3 h-3" />
              {t('test.multipleCorrect')}
            </Badge>
          )}
          {wrongCountForCurrent > 0 && (
            <Badge variant="warning">
              <AlertCircle className="w-3 h-3" />
              {t('test.errors', { count: wrongCountForCurrent })}
            </Badge>
          )}
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        <motion.div
          key={`q-${questionKey}`}
          initial={{ opacity: 0, y: 14, scale: 0.985, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -14, scale: 0.985, filter: 'blur(6px)' }}
          transition={{
            y: { type: 'spring', bounce: 0, duration: 0.35 },
            scale: { type: 'spring', bounce: 0, duration: 0.35 },
            opacity: { duration: 0.25, ease: 'easeOut' },
            filter: { duration: 0.25 },
          }}
          className="w-full"
        >
          <Card className="overflow-hidden bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800/80 shadow-sm">
            <div className="px-6 py-8 md:px-8 md:py-10">
              <div className="text-lg md:text-xl font-medium text-zinc-900 dark:text-zinc-50 leading-relaxed">
                <QuestionRenderer 
                  text={currentQuestion.text} 
                  sourceFile={currentQuestion.sourceFile} 
                  sessionId={sessionId} 
                />
              </div>
            </div>
            
            <div className="px-6 pb-6 md:px-8 md:pb-8 space-y-3">
              {shuffledOrder.map((originalIdx, shuffledIdx) => {
                const answer = currentQuestion.answers[originalIdx];
                const isCorrect = feedback?.correctShuffledIndices.includes(shuffledIdx);
                const isSelected = feedback
                  ? feedback.selectedAnswerIndices.includes(shuffledIdx)
                  : selectedIndices.includes(shuffledIdx);
                const isError = feedback !== null && isSelected && !isCorrect;
                const isSuccess = feedback !== null && isCorrect;

                let animationTarget: Record<string, any> = { scale: 1, x: 0, opacity: 1 };
                let transitionTarget: Record<string, any> = { type: 'spring', bounce: 0, duration: 0.25 };

                if (feedback !== null) {
                  if (isSuccess) {
                    animationTarget = {
                      scale: [1, 1.018, 1],
                      opacity: 1,
                    };
                    transitionTarget = {
                      duration: 0.35,
                      ease: [0.16, 1, 0.3, 1],
                    };
                  } else if (isError) {
                    animationTarget = {
                      x: [0, -6, 6, -4, 4, -2, 2, 0],
                      opacity: 1,
                    };
                    transitionTarget = {
                      duration: 0.4,
                      ease: 'easeInOut',
                    };
                  } else {
                    animationTarget = {
                      opacity: 0.4,
                    };
                    transitionTarget = {
                      duration: 0.2,
                    };
                  }
                }

                return (
                  <motion.button
                    key={answer.id}
                    type="button"
                    animate={animationTarget}
                    transition={transitionTarget}
                    whileTap={feedback === null ? { scale: 0.985 } : undefined}
                    whileHover={feedback === null ? { scale: 1.004 } : undefined}
                    onClick={() => onToggleAnswer(shuffledIdx)}
                    className={getAnswerButtonClass(shuffledIdx)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="mt-0.5">{getAnswerBadge(shuffledIdx)}</div>
                      <div className="flex-1">
                        <MarkdownRenderer content={answer.text} className="[&>p]:mb-0" />
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
            
            {/* Notatki osobiste (tylko po zatwierdzeniu odpowiedzi, by nie dekoncentrować, albo zawsze?) */}
            {/* Emil rule: always there, but subtle */}
            <div className="px-6 pb-4">
              <QuestionNoteEditor sessionId={sessionId} questionId={currentQuestion.id} />
            </div>

            {/* Apple HIG Keyboard hints */}
            {!hideNavigationHints && (
              <div className="hidden md:flex items-center justify-center gap-x-6 gap-y-2.5 pb-6 pt-2 flex-wrap px-4 text-xs text-zinc-400 dark:text-zinc-500 border-t border-zinc-100 dark:border-zinc-800/60 mt-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-zinc-500 dark:text-zinc-400">{t('test.keyboard')}</span>
                  <div className="flex items-center gap-1">
                    {currentQuestion.answers.map((_, i) => (
                      <kbd
                        key={i}
                        className="bg-zinc-100 dark:bg-zinc-800/80 px-1.5 py-0.5 rounded-md font-mono text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700 shadow-xs"
                      >
                        {ANSWER_KEYS[i]}
                      </kbd>
                    ))}
                  </div>
                  <span className="opacity-75">{isMultiAnswer ? t('test.mark') : t('test.select')}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <kbd className="bg-zinc-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded-md font-mono text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700 shadow-xs">
                    {t('test.space')}
                  </kbd>
                  <span className="opacity-40">/</span>
                  <kbd className="bg-zinc-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded-md font-mono text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700 shadow-xs">
                    Enter
                  </kbd>
                  <span className="opacity-75 font-medium text-zinc-600 dark:text-zinc-300">
                    {feedback ? t('test.nextBtn') : t('test.confirmBtn')}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <kbd className="bg-zinc-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded-md font-mono text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700 shadow-xs">
                    Backspace
                  </kbd>
                  <span className="opacity-75">{t('test.prevQuestion')}</span>
                </div>
              </div>
            )}
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const areQuestionCardPropsEqual = (
  prevProps: QuestionCardProps,
  nextProps: QuestionCardProps
): boolean => {
  if (prevProps.questionKey !== nextProps.questionKey) return false;
  if (prevProps.currentQuestion?.id !== nextProps.currentQuestion?.id) return false;
  if (prevProps.sessionId !== nextProps.sessionId) return false;
  if (prevProps.remainingCount !== nextProps.remainingCount) return false;
  if (prevProps.isMultiAnswer !== nextProps.isMultiAnswer) return false;
  if (prevProps.wrongCountForCurrent !== nextProps.wrongCountForCurrent) return false;
  if (prevProps.feedback !== nextProps.feedback) return false;
  if (prevProps.onToggleAnswer !== nextProps.onToggleAnswer) return false;
  if (prevProps.hideNavigationHints !== nextProps.hideNavigationHints) return false;

  // Compare selectedIndices
  if (prevProps.selectedIndices.length !== nextProps.selectedIndices.length) return false;
  for (let i = 0; i < prevProps.selectedIndices.length; i++) {
    if (prevProps.selectedIndices[i] !== nextProps.selectedIndices[i]) return false;
  }

  // Compare shuffledOrder
  if (prevProps.shuffledOrder.length !== nextProps.shuffledOrder.length) return false;
  for (let i = 0; i < prevProps.shuffledOrder.length; i++) {
    if (prevProps.shuffledOrder[i] !== nextProps.shuffledOrder[i]) return false;
  }

  return true;
};

export const QuestionCard = memo(QuestionCardComponent, areQuestionCardPropsEqual);
