import { type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import { ArrowLeft } from 'lucide-react';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { QuestionRenderer } from '../QuestionRenderer';
import { PreviousQuestionData } from '../../hooks/useTestEngine';

import { motion, AnimatePresence } from 'framer-motion';

interface PreviousQuestionModalProps {
  previousQuestion: PreviousQuestionData;
  sessionId: string;
  onClose: () => void;
}

export const PreviousQuestionModal: FC<PreviousQuestionModalProps> = ({
  previousQuestion,
  sessionId,
  onClose,
}) => {
  const { t } = useTranslation();

  return createPortal(
    <AnimatePresence>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-700 w-full max-w-xl max-h-[80vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4 flex-shrink-0" />
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              {t('test.prevQuestion')}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                previousQuestion.feedback.state === 'correct'
                  ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400'
                  : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400'
              }`}
            >
              {previousQuestion.feedback.state === 'correct'
                ? t('test.resultCorrect')
                : previousQuestion.feedback.selectedAnswerIndices.length === 0
                ? t('test.resultSkipped')
                : t('test.resultWrong')}
            </span>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-6 py-4">
          <div className="text-base font-semibold text-zinc-900 dark:text-zinc-50 leading-relaxed">
            <QuestionRenderer 
              text={previousQuestion.question.text} 
              sourceFile={previousQuestion.question.sourceFile} 
              sessionId={sessionId} 
            />
          </div>
        </div>

        <div className="px-6 pb-6 space-y-2">
          {previousQuestion.shuffledOrder.map((originalIdx, shuffledIdx) => {
            const answer = previousQuestion.question.answers[originalIdx];
            const isCorrect = previousQuestion.correctShuffledIndices.includes(shuffledIdx);
            const wasSelected = previousQuestion.feedback.selectedAnswerIndices.includes(shuffledIdx);

            let cls = 'flex items-start gap-3 px-4 py-3 rounded-xl border-2 text-sm ';
            let badgeEl;

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
      </motion.div>
    </motion.div>
    </AnimatePresence>,
    document.body
  );
};
