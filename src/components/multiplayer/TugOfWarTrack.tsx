import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, Trophy, Lightning, Sword } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { Player, TugSyncPayload } from '../../hooks/useMultiplayer';
import { cn } from '../../utils/cn';

interface TugOfWarTrackProps {
  players: Player[];
  currentUserId?: string;
  tugState: TugSyncPayload;
  className?: string;
}

export const TugOfWarTrack: React.FC<TugOfWarTrackProps> = ({
  players,
  currentUserId,
  tugState,
  className = '',
}) => {
  const { t } = useTranslation();

  // Drużyna A (parzyści) i Drużyna B (nieparzyści)
  const { teamA, teamB, myTeam } = useMemo(() => {
    const a: Player[] = [];
    const b: Player[] = [];
    players.forEach((p, idx) => {
      if (idx % 2 === 0) a.push(p);
      else b.push(p);
    });
    const myIndex = players.findIndex(p => p.userId === currentUserId);
    const my = (myIndex === -1 ? 0 : myIndex) % 2 === 0 ? 'A' : 'B';
    return { teamA: a, teamB: b, myTeam: my };
  }, [players, currentUserId]);

  const { ropePosition, timeLeftSeconds, winner, winReason } = tugState;

  // Normalizacja do procentów dla wskaźnika liny:
  // ropePosition: -100 (lewo/A) do +100 (prawo/B)
  // % lewo: 0% (skrajne A) do 100% (skrajne B), środek to 50%
  const markerPercent = Math.max(0, Math.min(100, (ropePosition + 100) / 2));

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isLowTime = timeLeftSeconds <= 15 && !winner;

  return (
    <div className={cn("w-full pt-1 select-none", className)}>
      {/* Top Bar: Team A vs Timer vs Team B */}
      <div className="flex items-center justify-between mb-2 px-1 text-xs">
        {/* Team A Info */}
        <div className="flex items-center gap-2 max-w-[38%] truncate">
          <div className="flex -space-x-1.5 overflow-hidden shrink-0">
            {teamA.map((p) => (
              <img
                key={p.userId}
                src={p.avatarUrl || 'https://via.placeholder.com/32'}
                alt={p.username}
                title={p.username}
                className={cn(
                  "inline-block h-6 w-6 rounded-full ring-2 object-cover",
                  p.userId === currentUserId
                    ? "ring-blue-500 scale-105 z-10"
                    : "ring-zinc-200 dark:ring-zinc-700"
                )}
              />
            ))}
          </div>
          <div className="flex flex-col truncate">
            <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
              <span>{t('multiplayer.tug.teamA', 'Drużyna Niebieska')}</span>
              {myTeam === 'A' && (
                <span className="text-[9px] bg-blue-500/15 text-blue-700 dark:text-blue-300 font-extrabold px-1 rounded-sm">
                  {t('multiplayer.race.youBadge', 'Ty')}
                </span>
              )}
            </span>
            <span className="text-[10px] text-zinc-500 truncate">
              {teamA.map(p => p.username).join(', ')}
            </span>
          </div>
        </div>

        {/* Center: Timer & Mode */}
        <div className="flex flex-col items-center shrink-0">
          <div className={cn(
            "flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono text-xs font-bold transition-colors",
            isLowTime
              ? "bg-red-500/15 text-red-600 dark:text-red-400 animate-pulse border border-red-500/30"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700/60"
          )}>
            <Timer className="w-3.5 h-3.5" weight="bold" />
            <span>{formatTimer(timeLeftSeconds)}</span>
          </div>
          <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-semibold mt-0.5 flex items-center gap-0.5">
            <Sword className="w-2.5 h-2.5 text-zinc-400" />
            <span>{t('multiplayer.tug.modeTitle', 'Przeciąganie Liny')}</span>
          </span>
        </div>

        {/* Team B Info */}
        <div className="flex items-center justify-end gap-2 max-w-[38%] truncate text-right">
          <div className="flex flex-col truncate items-end">
            <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
              {myTeam === 'B' && (
                <span className="text-[9px] bg-amber-500/15 text-amber-700 dark:text-amber-300 font-extrabold px-1 rounded-sm">
                  {t('multiplayer.race.youBadge', 'Ty')}
                </span>
              )}
              <span>{t('multiplayer.tug.teamB', 'Drużyna Bursztynowa')}</span>
            </span>
            <span className="text-[10px] text-zinc-500 truncate">
              {teamB.map(p => p.username).join(', ')}
            </span>
          </div>
          <div className="flex -space-x-1.5 overflow-hidden shrink-0">
            {teamB.map((p) => (
              <img
                key={p.userId}
                src={p.avatarUrl || 'https://via.placeholder.com/32'}
                alt={p.username}
                title={p.username}
                className={cn(
                  "inline-block h-6 w-6 rounded-full ring-2 object-cover",
                  p.userId === currentUserId
                    ? "ring-amber-500 scale-105 z-10"
                    : "ring-zinc-200 dark:ring-zinc-700"
                )}
              />
            ))}
          </div>
        </div>
      </div>

      {/* The Rope Track */}
      <div className="relative h-12 w-full bg-zinc-100 dark:bg-zinc-850/80 rounded-2xl flex items-center overflow-hidden border border-zinc-200/80 dark:border-zinc-700/80 shadow-inner px-4">
        {/* Left Side (Team A zone) gradient fill */}
        <div
          className="absolute inset-y-0 left-0 bg-blue-500/10 dark:bg-blue-500/15 transition-all duration-300 pointer-events-none"
          style={{ width: `${Math.max(0, 50 - markerPercent / 2)}%` }}
        />
        {/* Right Side (Team B zone) gradient fill */}
        <div
          className="absolute inset-y-0 right-0 bg-amber-500/10 dark:bg-amber-500/15 transition-all duration-300 pointer-events-none"
          style={{ width: `${Math.max(0, markerPercent / 2)}%` }}
        />

        {/* Center Neutral Zero Line */}
        <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-0.5 bg-zinc-300 dark:bg-zinc-600 flex flex-col justify-between py-1 items-center z-0 pointer-events-none opacity-60">
          <span className="w-1 h-1 rounded-full bg-zinc-400" />
          <span className="w-1 h-1 rounded-full bg-zinc-400" />
        </div>

        {/* Left KO Goal Area */}
        <div className="absolute left-1.5 top-1/2 -translate-y-1/2 z-10 flex items-center gap-1 pointer-events-none">
          <div className="px-1.5 py-0.5 rounded-md bg-blue-500/20 text-blue-700 dark:text-blue-300 text-[9px] font-black tracking-tighter uppercase border border-blue-500/30">
            K.O. A
          </div>
        </div>

        {/* Right KO Goal Area */}
        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 z-10 flex items-center gap-1 pointer-events-none">
          <div className="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[9px] font-black tracking-tighter uppercase border border-amber-500/30">
            K.O. B
          </div>
        </div>

        {/* The Rope Line Graphic */}
        <div className="w-full h-2 rounded-full relative z-10 bg-gradient-to-r from-blue-400 via-zinc-300 dark:via-zinc-600 to-amber-400 shadow-xs">
          {/* Subtle rope stripe texture */}
          <div className="absolute inset-0 opacity-40 bg-[linear-gradient(45deg,transparent_25%,rgba(0,0,0,0.2)_25%,rgba(0,0,0,0.2)_50%,transparent_50%,transparent_75%,rgba(0,0,0,0.2)_75%)] [background-size:8px_8px]" />
        </div>

        {/* Central Moving Knot & Marker */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20"
          animate={{ left: `${markerPercent}%` }}
          transition={{ type: 'spring', stiffness: 280, damping: 24 }}
        >
          <div className="relative flex flex-col items-center">
            {/* Knot Badge */}
            <div className={cn(
              "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shadow-lg border-2 transition-transform",
              ropePosition < -5
                ? "bg-blue-500 text-white border-blue-300 shadow-blue-500/40"
                : ropePosition > 5
                ? "bg-amber-500 text-white border-amber-300 shadow-amber-500/40"
                : "bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-500 shadow-black/30"
            )}>
              {ropePosition < -15 ? (
                <Lightning className="w-4 h-4 animate-bounce" weight="fill" />
              ) : ropePosition > 15 ? (
                <Lightning className="w-4 h-4 animate-bounce" weight="fill" />
              ) : (
                <div className="w-2.5 h-2.5 rounded-full bg-current" />
              )}
            </div>

            {/* Tension Indicator Tooltip */}
            <div className="absolute -bottom-4 bg-zinc-900/90 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full whitespace-nowrap shadow-xs pointer-events-none">
              {Math.abs(ropePosition)}%
            </div>
          </div>
        </motion.div>
      </div>

      {/* Winner Overlay Banner */}
      <AnimatePresence>
        {winner && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={cn(
              "mt-3 p-3 rounded-xl text-center shadow-lg flex items-center justify-center gap-2.5 border",
              winner === myTeam
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-800 dark:text-emerald-200"
                : winner === 'tie'
                ? "bg-zinc-500/15 border-zinc-500/30 text-zinc-800 dark:text-zinc-200"
                : "bg-amber-500/15 border-amber-500/30 text-amber-800 dark:text-amber-200"
            )}
          >
            <Trophy className="w-5 h-5 text-amber-500 shrink-0" weight="fill" />
            <div className="flex flex-col text-left">
              <span className="font-extrabold text-sm">
                {winner === myTeam
                  ? t('multiplayer.tug.youWin', 'Twoja drużyna zwyciężyła!')
                  : winner === 'tie'
                  ? t('multiplayer.tug.tie', 'Koniec czasu! Remis!')
                  : t('multiplayer.tug.otherWin', 'Przeciwnik przeciągnął linę!')}
              </span>
              <span className="text-[11px] opacity-80">
                {winReason === 'knockout'
                  ? t('multiplayer.tug.reasonKnockout', 'Zwycięstwo przez K.O. (przeciągnięcie do bazy)!')
                  : t('multiplayer.tug.reasonTimeout', 'Zwycięstwo na punkty po upływie czasu')}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
