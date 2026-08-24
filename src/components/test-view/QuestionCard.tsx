import { type FC, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Layers, AlertCircle, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { QuestionRenderer } from '../QuestionRenderer';
import { Question, AnswerFeedback } from '../../models/types';

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
}

const ANSWER_KEYS = ['1', '2', '3', '4', '5', '6'];

export const QuestionCard: FC<QuestionCardProps> = ({
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
}) => {
  const { t } = useTranslation();

  const getAnswerButtonClass = (shuffledIdx: number): string => {
    const base =
      'group w-full text-left px-5 py-4 rounded-xl border-2 font-medium text-sm transition duration-200 select-none leading-relaxed focus:outline-none';

    if (feedback === null) {
      const isSelected = selectedIndices.includes(shuffledIdx);
      if (isSelected) {
        return `${base} border-primary-500 bg-primary-50/80 dark:bg-primary-900/30 text-primary-900 dark:text-primary-100 shadow-sm cursor-pointer`;
      }
      return `${base} border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/60 text-zinc-800 dark:text-zinc-200 hover:border-primary-400 dark:hover:border-primary-500 hover:bg-primary-50/60 dark:hover:bg-primary-900/20 hover:shadow-sm cursor-pointer active:scale-[0.97]`;
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
          <div
            className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
              isSelected
                ? 'bg-primary-500 border-primary-500 text-white'
                : 'border-zinc-300 dark:border-zinc-600'
            }`}
          >
            {isSelected && (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            )}
          </div>
        );
      } else {
        return (
          <div
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${
              isSelected
                ? 'border-primary-500 text-primary-500'
                : 'border-zinc-300 dark:border-zinc-600 group-hover:border-primary-400 dark:group-hover:border-primary-500 text-zinc-400 dark:text-zinc-500 group-hover:text-primary-500'
            }`}
          >
            {isSelected ? <div className="w-2.5 h-2.5 rounded-full bg-primary-500" /> : ANSWER_KEYS[shuffledIdx]}
          </div>
        );
      }
    }

    const isCorrectAnswer = feedback.correctShuffledIndices.includes(shuffledIdx);
    const isSelectedAnswer = feedback.selectedAnswerIndices.includes(shuffledIdx);

    if (isCorrectAnswer) {
      return (
        <span className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 shadow mt-0.5">
          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </span>
      );
    }
    if (isSelectedAnswer && !isCorrectAnswer) {
      return (
        <span className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 shadow mt-0.5">
          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </span>
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
          initial={{ opacity: 0, transform: 'translateY(12px) scale(0.98)', filter: 'blur(8px)' }}
          animate={{ opacity: 1, transform: 'translateY(0px) scale(1)', filter: 'blur(0px)' }}
          exit={{ opacity: 0, transform: 'translateY(-12px) scale(0.98)', filter: 'blur(8px)' }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
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
                return (
                  <motion.button
                    whileTap={feedback === null ? { scale: 0.985 } : {}}
                    key={answer.id}
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

            {/* Keyboard hint */}
            <div className="hidden md:flex items-center justify-center gap-x-5 gap-y-3 pb-6 pt-1 flex-wrap px-4 text-xs text-zinc-400 dark:text-zinc-600">
              <div className="flex items-center gap-2">
                <span className="font-medium">{t('test.keyboard')}</span>
                <div className="flex items-center gap-1">
                  {currentQuestion.answers.map((_, i) => (
                    <kbd key={i} className="bg-zinc-100 dark:bg-zinc-800/80 px-1.5 py-0.5 rounded font-mono border border-zinc-200 dark:border-zinc-700 shadow-sm">
                      {ANSWER_KEYS[i]}
                    </kbd>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <kbd className="bg-zinc-100 dark:bg-zinc-800/80 px-1.5 py-0.5 rounded font-mono border border-zinc-200 dark:border-zinc-700 shadow-sm">
                  Enter
                </kbd>
                <span className="opacity-75">{feedback ? t('test.nextBtn') : t('test.confirmBtn')}</span>
              </div>

              <div className="flex items-center gap-2">
                <kbd className="bg-zinc-100 dark:bg-zinc-800/80 px-1.5 py-0.5 rounded font-mono border border-zinc-200 dark:border-zinc-700 shadow-sm">
                  Backspace
                </kbd>
                <span className="opacity-75">{t('test.prevQuestion')}</span>
              </div>
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
