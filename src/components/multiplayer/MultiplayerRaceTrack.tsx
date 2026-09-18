import React, { useMemo, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Medal, Car, FlagCheckered } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { Player } from '../../hooks/useMultiplayer';
import { cn } from '../../utils/cn';

interface MultiplayerRaceTrackProps {
  players: Player[];
  currentUserId?: string;
  className?: string;
}

export const MultiplayerRaceTrack: React.FC<MultiplayerRaceTrackProps> = ({
  players,
  currentUserId,
  className = '',
}) => {
  const { t } = useTranslation();
  const [finishBanner, setFinishBanner] = useState<string | null>(null);
  const finishedIdsRef = useRef<Set<string>>(new Set());

  // Sort players by progress (descending), active first, DNF last
  const rankedPlayers = useMemo(() => {
    return [...players].sort((a, b) => {
      const aDNF = a.status === 'disconnected' || a.isDNF;
      const bDNF = b.status === 'disconnected' || b.isDNF;
      if (aDNF && !bDNF) return 1;
      if (!aDNF && bDNF) return -1;
      if (b.progress !== a.progress) {
        return b.progress - a.progress;
      }
      if (a.finishedAt && b.finishedAt) {
        return a.finishedAt - b.finishedAt;
      }
      return 0;
    });
  }, [players]);

  // Detect when a player crosses the finish line
  useEffect(() => {
    players.forEach((p) => {
      const isFinished = p.progress >= 100 || Boolean(p.finishedAt);
      if (isFinished && !finishedIdsRef.current.has(p.userId)) {
        finishedIdsRef.current.add(p.userId);
        const isMe = p.userId === currentUserId;
        const msg = isMe
          ? t('multiplayer.race.finishedYou')
          : t('multiplayer.race.finishedOther', { name: p.username });
        setFinishBanner(msg);
        const timer = setTimeout(() => setFinishBanner(null), 3500);
        return () => clearTimeout(timer);
      }
    });
  }, [players, currentUserId, t]);

  const myRankIndex = rankedPlayers.findIndex((p) => p.userId === currentUserId);
  const myRank = myRankIndex >= 0 ? myRankIndex + 1 : 1;
  const totalInRace = rankedPlayers.length;
  const leader = rankedPlayers[0];
  const myPlayer = rankedPlayers.find((p) => p.userId === currentUserId);

  const getRankBadge = (rank: number) => {
    const text = t('multiplayer.race.rankPlace', { rank });
    if (rank === 1) return { text, icon: <Medal className="w-3.5 h-3.5 text-amber-500 shrink-0" weight="fill" />, color: 'text-amber-500 bg-amber-500/10' };
    if (rank === 2) return { text, icon: <Medal className="w-3.5 h-3.5 text-slate-400 shrink-0" weight="fill" />, color: 'text-slate-400 bg-slate-500/10' };
    if (rank === 3) return { text, icon: <Medal className="w-3.5 h-3.5 text-amber-700 dark:text-amber-600 shrink-0" weight="fill" />, color: 'text-amber-700 bg-amber-700/10' };
    return { text, icon: <Car className="w-3.5 h-3.5 text-zinc-500 shrink-0" weight="duotone" />, color: 'text-zinc-500 bg-zinc-500/10' };
  };

  const rankInfo = getRankBadge(myRank);

  return (
    <div className={cn("w-full pt-1", className)}>
      {/* Finish Notification Banner */}
      <AnimatePresence>
        {finishBanner && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.25 }}
            className="mb-1.5 py-0.5 px-3 mx-auto w-fit rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 shadow-xs"
          >
            <FlagCheckered className="w-3.5 h-3.5 shrink-0" weight="duotone" />
            <span>{finishBanner}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Track Top Bar: Live Rank & Competitors Summary */}
      <div className="flex items-center justify-between mb-1.5 px-0.5">
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-0.5 rounded-lg text-xs font-bold flex items-center gap-1.5 ${rankInfo.color}`}
          >
            {rankInfo.icon}
            <span>{rankInfo.text}</span>
          </span>
            {leader && leader.userId !== currentUserId && myPlayer && (
              <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 hidden xs:inline">
                {t('multiplayer.race.behindLeader', { diff: Math.max(0, Math.round(leader.progress - myPlayer.progress)) })}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            <Users className="w-3.5 h-3.5" />
            <span>{t('multiplayer.race.playersCount', { count: totalInRace })}</span>
          </div>
        </div>

        {/* The Track */}
        <div className="relative h-11 sm:h-12 w-full bg-zinc-100/90 dark:bg-zinc-800/60 rounded-xl flex items-center overflow-hidden border border-zinc-200/50 dark:border-zinc-700/50 shadow-inner">
          {/* Start Line Marker */}
          <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-zinc-300 dark:bg-zinc-600 rounded-full pointer-events-none" />

          {/* Milestone markers */}
          <div className="absolute left-10 right-14 inset-y-0 flex justify-between pointer-events-none items-center opacity-25">
            <div className="w-px h-3 bg-zinc-400" />
            <div className="w-px h-4 bg-zinc-400" />
            <div className="w-px h-3 bg-zinc-400" />
            <div className="w-px h-4 bg-zinc-400" />
          </div>

          {/* Finish Line (Checkered pattern) */}
          <div className="absolute right-9 sm:right-10 top-0 bottom-0 w-2.5 flex flex-col justify-between overflow-hidden opacity-50 dark:opacity-75 pointer-events-none border-x border-zinc-400/40 dark:border-zinc-500/40 bg-[linear-gradient(45deg,#18181b_25%,transparent_25%),linear-gradient(-45deg,#18181b_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#18181b_75%),linear-gradient(-45deg,transparent_75%,#18181b_75%)] dark:bg-[linear-gradient(45deg,#f4f4f5_25%,transparent_25%),linear-gradient(-45deg,#f4f4f5_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f4f4f5_75%),linear-gradient(-45deg,transparent_75%,#f4f4f5_75%)] [background-size:6px_6px] [background-position:0_0,0_3px,3px_-3px,-3px_0]" />

          {/* Finish Line Flag */}
          <div className="absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 z-10 select-none pointer-events-none text-zinc-700 dark:text-zinc-200">
            <FlagCheckered className="w-4 h-4 drop-shadow-xs" weight="duotone" />
          </div>

          {/* Moving Avatars (From start at left-4 to finish line at right-9/10) */}
          <div className="absolute left-4 right-9 sm:right-10 top-0 bottom-0">
            {players.map((p) => {
              const isMe = p.userId === currentUserId;
              const isDisconnected = p.status === 'disconnected' || p.isDNF;
              const isFinished = p.progress >= 100 || Boolean(p.finishedAt);
              const progressValue = isFinished ? 100 : Math.max(0, Math.min(100, p.progress));
              const initial = (p.username || 'Gracz').charAt(0).toUpperCase();
              const hue =
                (p.username || 'Gracz')
                  .split('')
                  .reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360;

              return (
                <motion.div
                  key={p.userId}
                  className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 ${
                    isFinished ? 'z-30' : isMe ? 'z-20' : 'z-10'
                  }`}
                  animate={{ left: `${progressValue}%` }}
                  transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                >
                  <div className={`relative group cursor-pointer ${isDisconnected ? 'opacity-40 grayscale' : ''}`}>
                    {p.avatarUrl ? (
                      <img
                        src={p.avatarUrl}
                        alt={p.username}
                        className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover shadow-sm transition-all ${
                          isFinished
                            ? 'ring-2 ring-amber-400 dark:ring-amber-300 ring-offset-2 dark:ring-offset-zinc-900 shadow-amber-500/30 shadow-md scale-110'
                            : isMe
                            ? 'ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-zinc-900 scale-110'
                            : 'border border-white dark:border-zinc-700'
                        }`}
                      />
                    ) : (
                      <div
                        className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center font-bold text-[10px] sm:text-xs text-white shadow-sm transition-all ${
                          isFinished
                            ? 'ring-2 ring-amber-400 dark:ring-amber-300 ring-offset-2 dark:ring-offset-zinc-900 shadow-amber-500/30 shadow-md scale-110'
                            : isMe
                            ? 'ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-zinc-900 scale-110'
                            : 'border border-white dark:border-zinc-700'
                        }`}
                        style={{ backgroundColor: `hsl(${hue}, 70%, 50%)` }}
                      >
                        {initial}
                      </div>
                    )}

                    {/* Finished Badge */}
                    {isFinished && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber-500 text-amber-950 text-[8px] sm:text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase tracking-tighter shadow-xs flex items-center gap-0.5 whitespace-nowrap">
                        <FlagCheckered className="w-2.5 h-2.5 shrink-0" weight="fill" />
                        <span>{t('multiplayer.race.finishBadge')}</span>
                      </div>
                    )}

                    {/* "Ty" Badge (when not finished) */}
                    {isMe && !isDisconnected && !isFinished && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-[9px] font-extrabold px-1 py-0.2 rounded-full uppercase tracking-tighter shadow-xs">
                        {t('multiplayer.race.youBadge')}
                      </div>
                    )}

                    {/* DNF Badge */}
                    {isDisconnected && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-zinc-600 text-white text-[8px] font-bold px-1 py-0.2 rounded-full uppercase tracking-tighter shadow-xs">
                        DNF
                      </div>
                    )}

                    {/* Hover tooltip with name & progress */}
                    <div className="opacity-0 group-hover:opacity-100 pointer-events-none absolute -bottom-6 left-1/2 -translate-x-1/2 bg-zinc-900/90 text-white text-[10px] font-medium py-0.5 px-1.5 rounded-md whitespace-nowrap transition-opacity z-40 shadow-md">
                      {p.username} {isDisconnected ? t('multiplayer.race.disconnected') : isFinished ? t('multiplayer.race.finished') : `(${Math.round(p.progress)}%)`}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };
