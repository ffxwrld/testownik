import React, { useState } from 'react';
import { Clock, CalendarDays, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useLeaderboard } from '../../hooks/useLeaderboard';
import { LeaderboardEntry } from '../../models/social';
import { LeaderboardTimeRange } from '../../utils/leaderboard';
import { Card } from '../ui/Card';
import { useAuth } from '../../hooks/useAuth';

export const LeaderboardView: React.FC = () => {
  
  const { user } = useAuth();

  const timeRanges: { id: LeaderboardTimeRange; label: string; icon: React.ReactNode }[] = [
    { id: '7_days', label: '7 Dni', icon: <Clock className="w-4 h-4" /> },
    { id: '30_days', label: '30 Dni', icon: <CalendarDays className="w-4 h-4" /> },
    { id: 'all_time', label: 'Ogółem', icon: <Calendar className="w-4 h-4" /> },
  ];

  const [activeRange, setActiveRange] = useState<LeaderboardTimeRange>('7_days');
  const { entries, loading: lbLoading, error: lbError } = useLeaderboard(activeRange);

  const top3 = entries.slice(0, 3);
  const rest = entries;

  const renderPodiumPlace = (entry: LeaderboardEntry | undefined, place: number) => {
    if (!entry) return <div className="w-24 opacity-0" />; // Spacer
    
    const isFirst = place === 1;
    const isMe = entry.user_id === user?.id;
    const initial = entry.username.charAt(0).toUpperCase();
    const hue = entry.username.split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0) % 360;

    const heights = { 1: 'h-32', 2: 'h-24', 3: 'h-20' };
    const colors = { 
      1: 'bg-yellow-400 dark:bg-yellow-500/80', 
      2: 'bg-slate-300 dark:bg-slate-500/80', 
      3: 'bg-amber-600 dark:bg-amber-700/80' 
    };

    return (
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: place * 0.1 }}
        className="flex flex-col items-center justify-end"
      >
        <div className="relative mb-2">
          {entry.avatar_url ? (
            <img src={entry.avatar_url} alt="Avatar" className={`rounded-full border-4 ${isFirst ? 'w-20 h-20 border-yellow-400' : 'w-16 h-16 border-zinc-200 dark:border-zinc-700'} object-cover shadow-lg`} />
          ) : (
            <div 
              className={`rounded-full border-4 flex items-center justify-center font-bold text-white shadow-lg ${isFirst ? 'w-20 h-20 border-yellow-400 text-2xl' : 'w-16 h-16 border-zinc-200 dark:border-zinc-700 text-xl'}`}
              style={{ backgroundColor: `hsl(${hue}, 60%, 50%)` }}
            >
              {initial}
            </div>
          )}
          {isFirst && (
            <div className="absolute -top-4 -right-2 text-2xl drop-shadow-md">👑</div>
          )}
        </div>
        <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate w-24 text-center">
          {entry.username} {isMe && <span className="text-primary-500">(Ty)</span>}
        </div>
        <div className="text-xs font-semibold text-primary-600 dark:text-primary-400 mb-2">
          {entry.value} XP
        </div>
        <div className={`w-20 ${heights[place as keyof typeof heights]} ${colors[place as keyof typeof colors]} rounded-t-lg flex items-start justify-center pt-2 shadow-inner`}>
          <span className="text-white font-black text-xl drop-shadow-sm">{place}</span>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="flex-1 bg-transparent text-zinc-900 dark:text-zinc-50 p-6 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between mb-8 mt-2">
          <h1 className="text-3xl font-bold tracking-tight">Ranking XP</h1>
        </div>

        <div className="flex flex-wrap gap-2 mb-10">
          {timeRanges.map(r => (
            <button
              key={r.id}
              onClick={() => setActiveRange(r.id)}
              className={`flex flex-shrink-0 items-center justify-center gap-2 px-4 py-2 rounded-xl font-bold transition border-2 ${
                activeRange === r.id 
                  ? 'border-primary-200 dark:border-primary-900/50 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 shadow-sm' 
                  : 'border-transparent bg-white/50 dark:bg-zinc-900/50 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'
              }`}
            >
              <span className="flex items-center justify-center">{r.icon}</span>
              {r.label}
            </button>
          ))}
        </div>

        {lbError && <div className="p-4 mb-4 bg-red-900/50 text-red-400 rounded-lg">{lbError}</div>}

        {lbLoading ? (
          <div className="animate-pulse space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white/50 dark:bg-zinc-900/50 shadow-sm rounded-xl"></div>)}
          </div>
        ) : entries.length > 0 ? (
          <>
            {/* Podium */}
            <div className="flex justify-center items-end gap-2 sm:gap-6 mb-12 mt-4 px-2">
              {renderPodiumPlace(top3[1], 2)}
              {renderPodiumPlace(top3[0], 1)}
              {renderPodiumPlace(top3[2], 3)}
            </div>

            {/* Rest of the leaderboard */}
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {rest.map((entry) => {
                  const initial = entry.username.charAt(0).toUpperCase();
                  const hue = entry.username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360;
                  const isMe = entry.user_id === user?.id;

                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      key={entry.user_id}
                    >
                      <Card className={`p-4 flex items-center gap-4 transition-colors ${
                        isMe 
                          ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800' 
                          : 'bg-white dark:bg-zinc-900'
                      }`}>
                        <div className="w-8 text-center text-lg font-bold text-zinc-400 dark:text-zinc-500 flex-shrink-0">
                          {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `${entry.rank}.`}
                        </div>
                        {entry.avatar_url ? (
                          <img src={entry.avatar_url} alt={entry.username} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                            style={{ backgroundColor: `hsl(${hue}, 60%, 50%)` }}
                          >
                            {initial}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                            {entry.username} {isMe && <span className="text-primary-500 text-sm">(Ty)</span>}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 flex items-center gap-2">
                          <div className="text-lg font-black text-primary-600 dark:text-primary-400 tabular-nums">
                            {entry.value}
                          </div>
                          <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">XP</span>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </>
        ) : (
          <div className="text-center text-zinc-500 dark:text-zinc-400 py-12">
            Brak wyników w tym przedziale czasowym.
          </div>
        )}
      </div>
    </div>
  );
};
