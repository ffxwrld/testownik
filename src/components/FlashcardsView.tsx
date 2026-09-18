import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { SessionState, Answer } from '../models/types';
import { useFlashcardsEngine } from '../hooks/useFlashcardsEngine';
import { MarkdownRenderer } from './MarkdownRenderer';
import { QuestionNoteEditor } from './test-view/QuestionNoteEditor';
import { Button } from './ui/Button';
import { BackButton } from './common/BackButton';
import { Confetti } from '@phosphor-icons/react';

interface Props {
  session: SessionState;
  sessionId: string;
  onExit: () => void;
}

const cardVariants: Variants = {
  enter: {
    scale: 0.94,
    opacity: 0,
    y: 24,
    x: 0,
    rotateZ: 0,
  },
  center: {
    scale: 1,
    opacity: 1,
    y: 0,
    x: 0,
    rotateZ: 0,
    transition: {
      type: 'spring',
      damping: 25,
      stiffness: 280,
    },
  },
  exit: (dir: 'left' | 'right' | null) => ({
    x: dir === 'right' ? 360 : dir === 'left' ? -360 : 0,
    y: dir ? -10 : -20,
    rotateZ: dir === 'right' ? 14 : dir === 'left' ? -14 : 0,
    opacity: 0,
    scale: 0.92,
    transition: {
      duration: 0.22,
      ease: [0.32, 0, 0.67, 0],
    },
  }),
};

export const FlashcardsView: React.FC<Props> = ({ session, sessionId, onExit }) => {
  const { t } = useTranslation();
  const engine = useFlashcardsEngine(session);
  const { currentQuestion, isFlipped, flipCard, markKnown, markRepeat, state, totalUnique } = engine;
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null);

  const handleMarkRepeat = () => {
    setExitDirection('left');
    markRepeat();
  };

  const handleMarkKnown = () => {
    setExitDirection('right');
    markKnown();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept keyboard shortcuts if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        flipCard();
      } else if (e.key === '1') {
        if (isFlipped) handleMarkRepeat();
      } else if (e.key === '2') {
        if (isFlipped) handleMarkKnown();
      } else if (e.code === 'ArrowLeft') {
        if (isFlipped) handleMarkRepeat();
      } else if (e.code === 'ArrowRight') {
        if (isFlipped) handleMarkKnown();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, flipCard, markKnown, markRepeat]);

  if (state.masteredIds.size === totalUnique && totalUnique > 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 dark:bg-black p-6 text-center">
        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-emerald-500/20">
          <Confetti className="w-10 h-10" weight="duotone" />
        </div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">{t('summary.testFinished')}</h2>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">{t('summary.testFinishedDesc', { count: totalUnique })}</p>
        <div className="flex gap-4">
          <Button variant="secondary" onClick={onExit}>{t('test.quit')}</Button>
          <Button variant="primary" onClick={engine.restart}>{t('sessionsList.startOver')}</Button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  const progress = (state.masteredIds.size / totalUnique) * 100;

  return (
    <div className="flex flex-col h-screen bg-zinc-50 dark:bg-black overflow-hidden relative">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center p-3 sm:p-4">
        <BackButton onClick={onExit} label={t('common.exit', 'Wyjdź')} variant="ghost" className="px-2" />
        <div className="flex-1 px-3 sm:px-4">
          <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden w-full max-w-md mx-auto">
            <div 
              className="h-full bg-emerald-500 rounded-full transition-[width] duration-200 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <div className="text-sm font-bold tabular-nums text-zinc-500 w-12 text-right">
          {state.masteredIds.size}/{totalUnique}
        </div>
      </header>

      <div 
        className="flex-1 flex items-center justify-center p-4 sm:p-6 min-h-0"
        style={{ perspective: '1500px', WebkitPerspective: '1500px' }}
      >
        <AnimatePresence mode="popLayout" custom={exitDirection}>
          <motion.div
            key={`${currentQuestion.id}-${state.currentIndex}`}
            custom={exitDirection}
            variants={cardVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="relative w-full max-w-xl aspect-[3/4] min-h-[340px] max-h-[62vh] sm:max-h-[70vh] cursor-pointer select-none"
            style={{ transformStyle: 'preserve-3d', WebkitTransformStyle: 'preserve-3d' }}
            onClick={flipCard}
          >
            <motion.div
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ type: 'spring', damping: 22, stiffness: 220 }}
              className="w-full h-full"
              style={{ transformStyle: 'preserve-3d', WebkitTransformStyle: 'preserve-3d' }}
            >
              {/* Front */}
              <div 
                className="absolute inset-0 bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200/50 dark:border-zinc-800/50 flex flex-col p-5 sm:p-8"
                style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
              >
                <div className="flex-1 flex items-center justify-center text-center overflow-y-auto hide-scrollbar">
                  <MarkdownRenderer content={currentQuestion.text} className="text-xl sm:text-2xl font-bold leading-snug" />
                </div>
                <div className="text-center text-xs sm:text-sm font-medium text-zinc-400 dark:text-zinc-600 pt-2 pb-1">
                  {t('flashcards.flipHint')}
                </div>
              </div>

              {/* Back */}
              <div 
                className="absolute inset-0 bg-zinc-100 dark:bg-zinc-900 rounded-3xl shadow-2xl border-2 border-emerald-500/20 flex flex-col p-5 sm:p-8 overflow-y-auto hide-scrollbar"
                style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              >
                <div className="pb-3 border-b border-zinc-200 dark:border-zinc-800 mb-4 sm:mb-6">
                  <MarkdownRenderer content={currentQuestion.text} className="text-sm sm:text-base font-medium text-zinc-500 dark:text-zinc-400" />
                </div>
                
                <div className="flex-1 flex flex-col gap-2.5 sm:gap-3 justify-center">
                  {currentQuestion.answers.filter((a: Answer) => a.isCorrect).map((a: Answer, i: number) => (
                    <div key={i} className="p-3.5 sm:p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 text-emerald-900 dark:text-emerald-100 font-semibold text-base sm:text-lg">
                      <MarkdownRenderer content={a.text} />
                    </div>
                  ))}
                  {currentQuestion.answers.filter((a: Answer) => !a.isCorrect).length === 0 && (
                    <p className="text-sm text-zinc-400 text-center mt-4">{t('flashcards.definitionOnly')}</p>
                  )}
                </div>

                <div className="mt-4 sm:mt-8" onClick={(e) => e.stopPropagation()}>
                  <QuestionNoteEditor sessionId={sessionId} questionId={currentQuestion.id} />
                </div>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Action Bar (visible only when flipped) */}
      <AnimatePresence>
        {isFlipped && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.25 }}
            className="flex-shrink-0 p-3 sm:p-6 flex items-center justify-center gap-3 sm:gap-4"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.94 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.15 }}
              onClick={(e) => { e.stopPropagation(); handleMarkRepeat(); }}
              className="flex-1 sm:flex-initial min-w-[120px] min-h-[48px] flex items-center justify-center gap-2 sm:gap-3 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 px-5 sm:px-6 py-3 sm:py-4 rounded-2xl font-bold transition-colors shadow-sm cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-red-400/50"
            >
              <kbd className="hidden sm:inline bg-red-200/80 dark:bg-red-900 px-2 py-0.5 rounded text-xs">1</kbd>
              {t('flashcards.repeatBtn')}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.94 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.15 }}
              onClick={(e) => { e.stopPropagation(); handleMarkKnown(); }}
              className="flex-1 sm:flex-initial min-w-[120px] min-h-[48px] flex items-center justify-center gap-2 sm:gap-3 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 px-5 sm:px-6 py-3 sm:py-4 rounded-2xl font-bold transition-colors shadow-sm cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
            >
              <kbd className="hidden sm:inline bg-emerald-200/80 dark:bg-emerald-900 px-2 py-0.5 rounded text-xs">2</kbd>
              {t('flashcards.knowBtn')}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
