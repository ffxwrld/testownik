import React, { useState } from 'react';
import { Clock, CalendarDots, Calendar, Crown, Trophy } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { useLeaderboard } from '../../hooks/useLeaderboard';
import { LeaderboardEntry } from '../../models/social';
import { LeaderboardTimeRange } from '../../utils/leaderboard';
import { Card } from '../ui/Card';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../utils/cn';

interface LeaderboardViewProps {
  showHeader?: boolean;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ showHeader = true }) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const timeRanges: { id: LeaderboardTimeRange; label: string; icon: React.ReactNode }[] = [
    { id: '7_days', label: t('social.leaderboard.ranges.sevenDays'), icon: <Clock className="w-4 h-4" /> },
    { id: '30_days', label: t('social.leaderboard.ranges.thirtyDays'), icon: <CalendarDots className="w-4 h-4" /> },
    { id: 'all_time', label: t('social.leaderboard.ranges.allTime'), icon: <Calendar className="w-4 h-4" /> },
  ];

  const [activeRange, setActiveRange] = useState<LeaderboardTimeRange>('7_days');
  const { entries, loading: lbLoading, error: lbError } = useLeaderboard(activeRange);

  const top3 = entries.slice(0, 3);
  const rest = entries;

  const renderPodiumPlace = (entry: LeaderboardEntry | undefined, place: number) => {
    if (!entry) return <div className="w-24 opacity-0" />; // Spacer
    
    const isFirst = place === 1;
    const initial = entry.username.charAt(0).toUpperCase();
    const hue = entry.username.split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0) % 360;

    const heights = { 1: 'h-36', 2: 'h-28', 3: 'h-24' };
    const colors = { 
      1: 'bg-gradient-to-t from-amber-500/20 to-amber-400/40 border border-amber-500/30 text-amber-500', 
      2: 'bg-gradient-to-t from-zinc-400/20 to-zinc-300/40 border border-zinc-400/30 text-zinc-400', 
      3: 'bg-gradient-to-t from-amber-700/20 to-amber-600/40 border border-amber-700/30 text-amber-700' 
    };

    return (
      <div 
        className="flex flex-col items-center justify-end flex-1 max-w-[140px]"
      >
        <div className="relative mb-3">
          {entry.avatar_url ? (
            <img 
              src={entry.avatar_url} 
              alt="Avatar" 
              className={`rounded-full border-2 ${isFirst ? 'w-20 h-20 border-amber-400 shadow-md ring-4 ring-amber-400/20' : 'w-16 h-16 border-zinc-200 dark:border-zinc-700'} object-cover`} 
            />
          ) : (
            <div 
              className={`rounded-full border-2 flex items-center justify-center font-bold text-white shadow-md ${
                isFirst ? 'w-20 h-20 border-amber-400 ring-4 ring-amber-400/20 text-2xl' : 'w-16 h-16 border-zinc-200 dark:border-zinc-700 text-xl'
              }`}
              style={{ backgroundColor: `hsl(${hue}, 60%, 50%)` }}
            >
              {initial}
            </div>
          )}
          {isFirst && (
            <div className="absolute -top-3.5 -right-1 bg-amber-400 text-amber-950 p-1 rounded-full shadow-md">
              <Crown className="w-4 h-4 fill-current" />
            </div>
          )}
        </div>

        <div className="text-center w-full px-1 mb-2">
          <div className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
            {entry.username}
          </div>
          <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 tabular-nums">
            {entry.value} XP
          </div>
        </div>

        <div className={`w-full ${heights[place as 1 | 2 | 3]} ${colors[place as 1 | 2 | 3]} rounded-2xl flex flex-col items-center justify-center relative overflow-hidden backdrop-blur-sm`}>
          <div className="text-2xl font-black tabular-nums tracking-tighter opacity-80">
            {place}
          </div>
          <div className="text-[10px] uppercase font-bold tracking-widest opacity-60">
            {t('social.leaderboard.place')}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={showHeader ? "w-full max-w-5xl mx-auto px-4 md:px-8 py-8" : "w-full"}>
      <div className="w-full">
        {showHeader && (
          <div className="flex items-center justify-between mb-8 mt-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
              <Trophy className="w-7 h-7 text-amber-500" />
              {t('social.leaderboard.communityTitle')}
            </h1>
          </div>
        )}

        {/* Apple Segmented Control for Time Ranges */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex p-1 rounded-2xl bg-zinc-200/60 dark:bg-zinc-800/60 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-700/50">
            {timeRanges.map((r) => (
              <button
                key={r.id}
                onClick={() => setActiveRange(r.id)}
                className={cn(
                  "relative flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors duration-200 z-10 active:scale-[0.98]",
                  activeRange === r.id
                    ? "text-zinc-900 dark:text-zinc-50 shadow-xs"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                )}
              >
                {activeRange === r.id && (
                  <motion.div
                    layoutId="leaderboard-range-pill"
                    className="absolute inset-0 bg-white dark:bg-zinc-700/90 rounded-xl shadow-xs -z-10"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                {r.icon}
                <span>{r.label}</span>
              </button>
            ))}
          </div>

          <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            {t('social.leaderboard.participantsCount', { count: entries.length })}
          </div>
        </div>

        {lbError && (
          <div className="p-4 mb-6 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-2xl text-sm font-medium">
            {lbError}
          </div>
        )}

        {lbLoading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-zinc-200/50 dark:bg-zinc-800/50 rounded-2xl" />
            ))}
          </div>
        ) : entries.length > 0 ? (
          <>
            {/* Podium */}
            <div className="flex justify-center items-end gap-2 sm:gap-6 mb-12 mt-4 px-2 max-w-md mx-auto">
              {renderPodiumPlace(top3[1], 2)}
              {renderPodiumPlace(top3[0], 1)}
              {renderPodiumPlace(top3[2], 3)}
            </div>

            {/* Rest of the leaderboard */}
            <div className="space-y-2.5 max-w-3xl mx-auto">
              <AnimatePresence mode="popLayout">
                {rest.map((entry) => {
                  const initial = entry.username.charAt(0).toUpperCase();
                  const hue = entry.username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360;
                  const isMe = entry.user_id === user?.id;

                  return (
                    <motion.div
                      layout
                      initial={false}
                      exit={{ opacity: 0, scale: 0.95 }}
                      key={entry.user_id}
                    >
                      <Card className={cn(
                        "p-4 flex items-center gap-4 transition-colors duration-150",
                        isMe && "ring-2 ring-primary-500/40 bg-primary-50/30 dark:bg-primary-950/20"
                      )}>
                        <div className="w-8 flex items-center justify-center flex-shrink-0">
                          {entry.rank === 1 ? (
                            <span className="w-6 h-6 rounded-full bg-amber-400 text-amber-950 text-xs font-black flex items-center justify-center shadow-xs">1</span>
                          ) : entry.rank === 2 ? (
                            <span className="w-6 h-6 rounded-full bg-zinc-300 dark:bg-zinc-600 text-zinc-900 dark:text-zinc-100 text-xs font-black flex items-center justify-center shadow-xs">2</span>
                          ) : entry.rank === 3 ? (
                            <span className="w-6 h-6 rounded-full bg-amber-700/80 text-white text-xs font-black flex items-center justify-center shadow-xs">3</span>
                          ) : (
                            <span className="text-sm font-bold text-zinc-400 dark:text-zinc-500 tabular-nums">{entry.rank}</span>
                          )}
                        </div>
                        
                        {entry.avatar_url ? (
                          <img src={entry.avatar_url} alt={entry.username} className="w-10 h-10 rounded-full object-cover shadow-xs" />
                        ) : (
                          <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-xs"
                            style={{ backgroundColor: `hsl(${hue}, 60%, 50%)` }}
                          >
                            {initial}
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate flex items-center gap-2">
                            {entry.username}
                            {isMe && (
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-primary-500/10 text-primary-600 dark:text-primary-400">
                                {t('social.leaderboard.you')}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0 flex items-center gap-1.5">
                          <span className="text-base font-black text-primary-600 dark:text-primary-400 tabular-nums">
                            {entry.value}
                          </span>
                          <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">XP</span>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </>
        ) : (
          <div className="text-center text-zinc-500 dark:text-zinc-400 py-16">
            {t('social.leaderboard.emptyRange')}
          </div>
        )}
      </div>
    </div>
  );
};
