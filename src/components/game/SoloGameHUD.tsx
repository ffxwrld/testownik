import { FC, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Heart, Lightning, Sparkle, X, SpeakerHigh, SpeakerSimpleX, Flame, Check } from '@phosphor-icons/react';
import { SoloGameMode } from '../../utils/arcadeStorage';
import { isSoundMuted, toggleSoundMuted } from '../../utils/sound';
import { TimeDeltaNotification } from '../../hooks/useSoloGameEngine';
import { cn } from '../../utils/cn';

interface SoloGameHUDProps {
  mode: SoloGameMode;
  lives: number;
  timeRemaining: number;
  score: number;
  combo: number;
  streak: number;
  questionIndex: number;
  totalQuestions: number;
  timeDeltaNotification?: TimeDeltaNotification | null;
  onFinishZen?: () => void;
  onExit: () => void;
}

export const SoloGameHUD: FC<SoloGameHUDProps> = ({
  mode,
  lives,
  timeRemaining,
  score,
  combo,
  streak,
  questionIndex,
  totalQuestions,
  timeDeltaNotification,
  onFinishZen,
  onExit,
}) => {
  const { t, i18n } = useTranslation();
  const [muted, setMuted] = useState(() => isSoundMuted());

  useEffect(() => {
    const handleSoundToggle = (e: Event) => {
      const custom = e as CustomEvent<boolean>;
      if (typeof custom.detail === 'boolean') {
        setMuted(custom.detail);
      } else {
        setMuted(isSoundMuted());
      }
    };
    window.addEventListener('testownik-sound-toggle', handleSoundToggle);
    return () => window.removeEventListener('testownik-sound-toggle', handleSoundToggle);
  }, []);

  const handleToggleMute = () => {
    const next = toggleSoundMuted();
    setMuted(next);
  };

  return (
    <div className="fixed top-4 inset-x-0 z-40 flex justify-center pointer-events-none px-4">
      <header className="pointer-events-auto w-full max-w-2xl h-14 px-4 sm:px-5 rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl border border-white/50 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex items-center justify-between gap-3 transition-all duration-200">
        {/* Left: Exit button & Mode indicator */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onExit}
            aria-label={t('games.hud.exit')}
            className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 bg-zinc-100/70 dark:bg-zinc-800/70 hover:bg-zinc-200/80 dark:hover:bg-zinc-700/80 active:scale-95 transition-all focus:outline-none cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-100/80 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300">
            {mode === 'sudden-death' && (
              <>
                <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                <span>Sudden Death</span>
              </>
            )}
            {mode === 'time-attack' && (
              <>
                <Lightning className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>Time Attack</span>
              </>
            )}
            {mode === 'zen' && (
              <>
                <Sparkle className="w-3.5 h-3.5 text-primary-500" />
                <span>{t('games.solo.zen.title')}</span>
              </>
            )}
          </div>

          {mode === 'zen' && onFinishZen && (
            <button
              type="button"
              onClick={onFinishZen}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-900/60 border border-primary-200/50 dark:border-primary-800/50 transition-colors cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{t('games.solo.finishSession', 'Zakończ sesję')}</span>
            </button>
          )}
        </div>

        {/* Center: Dynamic Island style indicator */}
        <div className="flex items-center justify-center">
          {mode === 'sudden-death' && (
            <div className="flex items-center gap-1.5 sm:gap-2">
              {[0, 1, 2].map(heartIndex => {
                const isAlive = heartIndex < lives;
                return (
                  <motion.div
                    key={heartIndex}
                    animate={
                      isAlive
                        ? { scale: [1, 1.12, 1], opacity: 1 }
                        : { scale: 0.82, opacity: 0.2 }
                    }
                    transition={{
                      type: 'spring',
                      bounce: 0,
                      duration: 0.35,
                    }}
                    className="flex items-center justify-center"
                  >
                    <Heart
                      className={cn(
                        'w-6 h-6 sm:w-7 sm:h-7 transition-colors duration-200',
                        isAlive
                          ? 'text-rose-500 fill-rose-500 drop-shadow-[0_2px_8px_rgba(244,63,94,0.35)]'
                          : 'text-zinc-300 dark:text-zinc-700 fill-none'
                      )}
                    />
                  </motion.div>
                );
              })}
            </div>
          )}

          {mode === 'time-attack' && (
            <div className="relative flex items-center gap-2">
              <div
                className={cn(
                  'font-mono text-xl sm:text-2xl font-black tracking-tight tabular-nums transition-colors duration-150',
                  timeRemaining > 20 && 'text-emerald-600 dark:text-emerald-400',
                  timeRemaining <= 20 && timeRemaining > 10 && 'text-amber-500 dark:text-amber-400',
                  timeRemaining <= 10 && 'text-rose-600 dark:text-rose-500 animate-pulse'
                )}
              >
                {timeRemaining.toFixed(1)}s
              </div>
              <AnimatePresence>
                {timeDeltaNotification && (
                  <motion.span
                    key={timeDeltaNotification.id}
                    initial={{ opacity: 0, y: 0, scale: 0.8 }}
                    animate={{ opacity: 1, y: -20, scale: 1.1 }}
                    exit={{ opacity: 0, y: -28, scale: 0.9 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className={cn(
                      'absolute -top-1 left-full ml-1 font-mono font-black text-xs sm:text-sm pointer-events-none drop-shadow-sm',
                      timeDeltaNotification.type === 'bonus'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    )}
                  >
                    {timeDeltaNotification.text}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          )}

          {mode === 'zen' && (
            <div className="text-xs sm:text-sm font-semibold text-zinc-500 dark:text-zinc-400 tabular-nums">
              {questionIndex + 1} / {totalQuestions}
            </div>
          )}
        </div>

        {/* Right: Combo, Score & Audio toggle */}
        <div className="flex items-center gap-2.5">
          <AnimatePresence>
            {streak > 1 && (
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.7, opacity: 0 }}
                transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
                className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400"
              >
                <span>{streak}x {t('games.hud.streak').toLowerCase()}</span>
              </motion.div>
            )}
            {combo > 1 && (
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.7, opacity: 0 }}
                transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black tracking-wide bg-amber-500 text-white shadow-sm shadow-amber-500/25"
              >
                <Flame className="w-3 h-3 fill-current" />
                <span>x{combo}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="text-right">
            <span className="font-mono text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 tabular-nums tracking-tight">
              {score.toLocaleString()}
            </span>
          </div>

          <button
            type="button"
            onClick={handleToggleMute}
            aria-label={muted ? (i18n.language === 'en' ? 'Unmute sound' : 'Włącz dźwięk') : (i18n.language === 'en' ? 'Mute sound' : 'Wycisz dźwięk')}
            className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/70 active:scale-95 transition-all focus:outline-none cursor-pointer"
          >
            {muted ? <SpeakerSimpleX className="w-3.5 h-3.5" /> : <SpeakerHigh className="w-3.5 h-3.5" />}
          </button>
        </div>
      </header>
    </div>
  );
};
