import { type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, SkipForward, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';

interface TestSidebarProps {
  requiredStreak: number;
  consecutiveCorrect: number;
  feedback: any | null;
  isTransitioning: boolean;
  selectedIndices: number[];
  canConfirm: boolean;
  hasPreviousQuestion: boolean;
  onConfirm: () => void;
  onNext: () => void;
  onShowPrevious: () => void;
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
}) => {
  const { t } = useTranslation();

  const renderStreakDots = () => {
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        {Array.from({ length: requiredStreak }, (_, i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full transition duration-200 ${
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

  return (
    <div className="w-full md:w-64 flex-shrink-0 flex flex-col gap-4">
      {requiredStreak > 1 && (
        <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 px-5 py-4 flex flex-col items-center shadow-sm mb-4 md:mb-0">
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-2 font-medium uppercase tracking-wide">
            {t('test.streakTitle')}
          </p>
          {renderStreakDots()}
        </div>
      )}

      {/* STICKY BOTTOM BAR ON MOBILE */}
      <div className="fixed bottom-0 left-0 right-0 z-40 p-4 pb-8 bg-white/85 dark:bg-zinc-950/85 backdrop-blur-xl border-t border-zinc-200/50 dark:border-zinc-800/50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.2)] md:shadow-none md:relative md:bottom-auto md:left-auto md:right-auto md:z-auto md:p-0 md:bg-transparent md:dark:bg-transparent md:backdrop-blur-none md:border-none flex flex-col gap-3">
        
        {/* Container limit for mobile so buttons don't stretch to 100vw on tablets */}
        <div className="w-full max-w-md mx-auto md:max-w-none flex flex-col gap-3">
          
          <div className="relative min-h-[56px] w-full">
            <AnimatePresence mode="popLayout" initial={false}>
              {feedback === null ? (
                <motion.div
                  key="confirm-btn"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="w-full"
                >
                  <Button
                    onClick={onConfirm}
                    variant="primary"
                    size="lg"
                    disabled={!canConfirm || isTransitioning}
                    className={`w-full rounded-xl transition shadow-xl shadow-primary-600/20 ${
                      selectedIndices.length === 0 ? 'opacity-60' : ''
                    }`}
                  >
                    {selectedIndices.length === 0 ? (
                      <>
                        <SkipForward className="w-5 h-5" />
                        {t('test.skipBtn')}
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        {t('test.confirmBtn')}
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
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="w-full"
                >
                  <Button
                    onClick={onNext}
                    variant="primary"
                    size="lg"
                    disabled={isTransitioning}
                    className="w-full rounded-xl shadow-xl shadow-primary-600/20"
                  >
                    {t('test.nextBtn')}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {hasPreviousQuestion && (
            <button
              onClick={onShowPrevious}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white/60 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition duration-150 text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4 flex-shrink-0" />
              <span>{t('test.prevQuestion')}</span>
            </button>
          )}

        </div>
      </div>
    </div>
  );
};
