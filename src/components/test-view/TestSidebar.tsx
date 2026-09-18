import { type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, SkipForward, ArrowLeft, SidebarSimple } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';
import { AnswerFeedback } from '../../models/types';

interface TestSidebarProps {
  requiredStreak: number;
  consecutiveCorrect: number;
  feedback: AnswerFeedback | null;
  isTransitioning: boolean;
  selectedIndices: number[];
  canConfirm: boolean;
  hasPreviousQuestion: boolean;
  onConfirm: () => void;
  onNext: () => void;
  onShowPrevious: () => void;
  isCollapsed?: boolean;
  onExpand?: () => void;
}

export const TestSidebar: FC<TestSidebarProps> = ({
  requiredStreak,
  consecutiveCorrect,
  feedback,
  isTransitioning,
  selectedIndices,
  canConfirm,
  hasPreviousQuestion,
  onConfirm,
  onNext,
  onShowPrevious,
  isCollapsed = false,
  onExpand,
}) => {
  const { t } = useTranslation();

  const renderStreakDots = (compact = false) => {
    return (
      <div className="flex items-center gap-1.5 flex-wrap justify-center">
        {Array.from({ length: requiredStreak }, (_, i) => {
          const isActive = i < consecutiveCorrect;
          return (
            <motion.div
              key={i}
              initial={false}
              animate={
                isActive
                  ? { scale: [1, 1.35, 1], backgroundColor: '#10b981' }
                  : { scale: 1, backgroundColor: '#a1a1aa' }
              }
              transition={{ type: 'spring', bounce: 0.35, duration: 0.35 }}
              className={`w-2.5 h-2.5 rounded-full ${
                isActive
                  ? 'bg-emerald-500 shadow-xs shadow-emerald-500/50'
                  : 'bg-zinc-300 dark:bg-zinc-600'
              }`}
            />
          );
        })}
        <span className={`text-zinc-500 dark:text-zinc-400 font-medium ${compact ? 'text-[11px] ml-0.5' : 'text-xs ml-1'}`}>
          {t('test.streak')}
        </span>
      </div>
    );
  };

  const renderActionButtons = (size: 'md' | 'lg' = 'lg') => {
    return (
      <div className="relative min-h-[52px] w-full flex items-center">
        <AnimatePresence mode="popLayout" initial={false}>
          {feedback === null ? (
            <motion.div
              key="confirm-btn"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.22 }}
              className="w-full"
            >
              <Button
                onClick={onConfirm}
                variant="primary"
                size={size}
                disabled={!canConfirm || isTransitioning}
                className={`w-full rounded-xl transition-all shadow-md shadow-primary-600/20 active:scale-[0.98] ${
                  selectedIndices.length === 0 ? 'opacity-70' : ''
                }`}
              >
                {selectedIndices.length === 0 ? (
                  <>
                    <SkipForward className="w-4 h-4" />
                    <span>{t('test.skipBtn')}</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{t('test.confirmBtn')}</span>
                  </>
                )}
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="next-btn"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.22 }}
              className="w-full"
            >
              <Button
                onClick={onNext}
                variant="primary"
                size={size}
                disabled={isTransitioning}
                className="w-full rounded-xl shadow-md shadow-primary-600/20 active:scale-[0.98]"
              >
                <span>{t('test.nextBtn')}</span>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <>
      {/* ──────────────────────────────────────────────────────────────────
          DESKTOP: Normal side column (when not collapsed)
      ────────────────────────────────────────────────────────────────── */}
      {!isCollapsed && (
        <motion.aside
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 12 }}
          transition={{ duration: 0.2 }}
          className="hidden md:flex w-64 flex-shrink-0 flex-col gap-4 self-center"
        >
          {requiredStreak > 1 && (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 px-5 py-4 flex flex-col items-center shadow-xs">
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-2 font-semibold uppercase tracking-wider">
                {t('test.streakTitle')}
              </p>
              {renderStreakDots()}
            </div>
          )}

          <div className="flex flex-col gap-3">
            {renderActionButtons('lg')}

            {hasPreviousQuestion && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                whileHover={{ scale: 1.01 }}
                transition={{ type: 'spring', bounce: 0, duration: 0.15 }}
                onClick={onShowPrevious}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-all text-sm font-medium cursor-pointer shadow-xs"
              >
                <ArrowLeft className="w-4 h-4 flex-shrink-0" />
                <span>{t('test.prevQuestion')}</span>
              </motion.button>
            )}
          </div>
        </motion.aside>
      )}

      {/* ──────────────────────────────────────────────────────────────────
          DESKTOP: Floating Action Dock (when collapsed)
      ────────────────────────────────────────────────────────────────── */}
      {isCollapsed && (
        <motion.div
          key="floating-dock"
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.96 }}
          transition={{ type: 'spring', bounce: 0.15, duration: 0.28 }}
          className="hidden md:flex fixed bottom-6 left-1/2 -translate-x-1/2 z-40 items-center gap-3 px-5 py-2.5 rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-2xl shadow-black/25 select-none"
        >
          {requiredStreak > 1 && (
            <>
              <div className="flex items-center px-1">
                {renderStreakDots(true)}
              </div>
              <div className="w-px h-5 bg-zinc-200 dark:border-zinc-700" />
            </>
          )}

          {hasPreviousQuestion && (
            <button
              type="button"
              onClick={onShowPrevious}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title={t('test.prevQuestion')}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t('test.prevQuestion')}</span>
            </button>
          )}

          <div className="min-w-[150px]">
            {renderActionButtons('md')}
          </div>

          {onExpand && (
            <button
              type="button"
              onClick={onExpand}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title={t('test.expandSidebar')}
              aria-label={t('test.expandSidebar')}
            >
              <SidebarSimple className="w-4 h-4" />
            </button>
          )}
        </motion.div>
      )}

      {/* ──────────────────────────────────────────────────────────────────
          MOBILE: Clean Sticky Bottom Bar with Safe-Area
      ────────────────────────────────────────────────────────────────── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-200/60 dark:border-zinc-800/60 shadow-[0_-8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_-8px_32px_rgba(0,0,0,0.3)] flex flex-col gap-2">
        <div className="w-full max-w-md mx-auto flex flex-col gap-2">
          {requiredStreak > 1 && (
            <div className="flex items-center justify-center pb-0.5">
              {renderStreakDots(true)}
            </div>
          )}

          {renderActionButtons('lg')}

          {hasPreviousQuestion && (
            <button
              type="button"
              onClick={onShowPrevious}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t('test.prevQuestion')}</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
};

