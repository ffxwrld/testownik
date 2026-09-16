import { FC } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Trophy, RotateCcw, Home, Sparkles, Flame, Target, Clock, ShieldAlert, Timer } from 'lucide-react';
import { SoloGameMode, SoloModeRecord } from '../../utils/arcadeStorage';

interface SoloGameOverModalProps {
  isOpen: boolean;
  mode: SoloGameMode;
  isVictory: boolean;
  score: number;
  longestStreak: number;
  totalAnswered: number;
  correctCount: number;
  durationSeconds: number;
  record: SoloModeRecord;
  isNewHighScore: boolean;
  isNewBestStreak: boolean;
  onRestart: () => void;
  onExit: () => void;
}

export const SoloGameOverModal: FC<SoloGameOverModalProps> = ({
  isOpen,
  mode,
  isVictory,
  score,
  longestStreak,
  totalAnswered,
  correctCount,
  durationSeconds,
  record,
  isNewHighScore,
  isNewBestStreak,
  onRestart,
  onExit,
}) => {
  const { t } = useTranslation();
  if (!isOpen) return null;

  const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;

  const getTitle = () => {
    if (isVictory) return t('games.gameOver.victoryTitle');
    if (mode === 'time-attack') return t('games.gameOver.timeUpTitle');
    if (mode === 'sudden-death') return t('games.gameOver.defeatTitle');
    return t('games.gameOver.zenTitle');
  };

  const getSubtitle = () => {
    if (isVictory) return t('games.gameOver.victorySub');
    if (mode === 'time-attack') return t('games.gameOver.timeUpSub');
    if (mode === 'sudden-death') return t('games.gameOver.defeatSub');
    return t('games.gameOver.zenSub');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-2xl overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
        className="w-full max-w-md bg-white/90 dark:bg-zinc-900/90 backdrop-blur-3xl border border-white/60 dark:border-white/10 rounded-3xl shadow-[0_24px_64px_rgba(0,0,0,0.25)] p-7 sm:p-8 text-center"
      >
        {/* Squircle Icon */}
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center bg-zinc-100 dark:bg-zinc-800/80 shadow-xs">
          {isVictory ? (
            <Trophy className="w-8 h-8 text-amber-500" strokeWidth={2} />
          ) : mode === 'time-attack' ? (
            <Timer className="w-8 h-8 text-amber-500" strokeWidth={2} />
          ) : mode === 'sudden-death' ? (
            <ShieldAlert className="w-8 h-8 text-rose-500" strokeWidth={2} />
          ) : (
            <Sparkles className="w-8 h-8 text-primary-500" strokeWidth={2} />
          )}
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight mb-1.5">
          {getTitle()}
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed">
          {getSubtitle()}
        </p>

        {/* High Score Banner */}
        {(isNewHighScore || isNewBestStreak) && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-6 py-2 px-4 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-300 text-xs font-semibold flex items-center justify-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>
              {isNewHighScore && isNewBestStreak
                ? `${t('games.gameOver.newHighScore')} & ${t('games.gameOver.newBestStreak')}`
                : isNewHighScore
                ? t('games.gameOver.newHighScore')
                : t('games.gameOver.newBestStreak')}
            </span>
          </motion.div>
        )}

        {/* Apple Activity Grouped Metrics */}
        <div className="rounded-2xl bg-zinc-100/60 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-800/80 divide-y divide-zinc-200/60 dark:divide-zinc-800/80 mb-7 text-left text-sm">
          <div className="p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-zinc-600 dark:text-zinc-400 font-medium">
              <Sparkles className="w-4 h-4 text-primary-500" />
              <span>{t('games.gameOver.stats.score')}</span>
            </div>
            <div className="text-right">
              <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                {score.toLocaleString()} {t('games.hud.score').toLowerCase()}
              </span>
              <span className="text-xs text-zinc-400 dark:text-zinc-500 block">
                {t('games.solo.timeAttack.record')}: {record.highScore.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-zinc-600 dark:text-zinc-400 font-medium">
              <Flame className="w-4 h-4 text-rose-500" />
              <span>{t('games.gameOver.stats.streak')}</span>
            </div>
            <div className="text-right">
              <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                {longestStreak}
              </span>
              <span className="text-xs text-zinc-400 dark:text-zinc-500 block">
                {t('games.solo.timeAttack.record')}: {record.bestStreak}
              </span>
            </div>
          </div>

          <div className="p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-zinc-600 dark:text-zinc-400 font-medium">
              <Target className="w-4 h-4 text-emerald-500" />
              <span>{t('games.gameOver.stats.accuracy')}</span>
            </div>
            <div className="text-right">
              <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                {accuracy}%
              </span>
              <span className="text-xs text-zinc-400 dark:text-zinc-500 block">
                {correctCount} / {totalAnswered}
              </span>
            </div>
          </div>

          <div className="p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-zinc-600 dark:text-zinc-400 font-medium">
              <Clock className="w-4 h-4 text-blue-500" />
              <span>{t('games.gameOver.stats.time')}</span>
            </div>
            <div className="text-right">
              <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                {durationSeconds}s
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onRestart}
            className="w-full h-12 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-sm focus:outline-none cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{t('games.gameOver.playAgain')}</span>
          </button>
          <button
            type="button"
            onClick={onExit}
            className="w-full h-12 rounded-xl bg-zinc-100 hover:bg-zinc-200/80 dark:bg-zinc-800/80 dark:hover:bg-zinc-700/80 text-zinc-700 dark:text-zinc-300 font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all focus:outline-none cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>{t('games.gameOver.exit')}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
