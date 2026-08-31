import React, { useState } from 'react';
import { Trophy, BookOpen, Flame, Target, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useLeaderboard } from '../../hooks/useLeaderboard';
import { LeaderboardCategory } from '../../models/social';
import { Card } from '../ui/Card';
import { useAuth } from '../../hooks/useAuth';

export const LeaderboardView: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const categories: { id: LeaderboardCategory; label: string; icon: React.ReactNode }[] = [
    { id: 'xp', label: t('social.leaderboard.xpTab', 'XP'), icon: <Trophy className="w-4 h-4" /> },
    { id: 'accuracy', label: t('social.leaderboard.accTab', 'Skuteczność'), icon: <Target className="w-4 h-4" /> },
    { id: 'sessions', label: t('social.leaderboard.sessTab', 'Sesje'), icon: <BookOpen className="w-4 h-4" /> },
    { id: 'streak', label: t('social.leaderboard.streakTab', 'Seria'), icon: <Flame className="w-4 h-4" /> },
    { id: 'study_time', label: t('social.leaderboard.timeTab', 'Czas'), icon: <Clock className="w-4 h-4" /> }
  ];

  const [activeCategory, setActiveCategory] = useState<LeaderboardCategory>('xp');
  const { entries, loading: lbLoading, error: lbError } = useLeaderboard(activeCategory);

  const formatValue = (value: number, category: LeaderboardCategory) => {
    switch (category) {
      case 'accuracy': return `${value}%`;
      case 'study_time': return `${Math.round(value / 60)} min`;
      case 'streak': return `${value} dni`;
      default: return value.toString();
    }
  };

  return (
    <div className="flex-1 bg-transparent text-zinc-900 dark:text-zinc-50 p-6 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between mb-8 mt-2">
          <h1 className="text-3xl font-bold tracking-tight">Ranking</h1>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`flex flex-shrink-0 items-center justify-center gap-2 px-4 py-2 rounded-xl font-bold transition border-2 ${
                activeCategory === c.id 
                  ? 'border-primary-200 dark:border-primary-900/50 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 shadow-sm' 
                  : 'border-transparent bg-white/50 dark:bg-zinc-900/50 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'
              }`}
            >
              <span className="flex items-center justify-center">{c.icon}</span>
              {c.label}
            </button>
          ))}
        </div>

        {lbError && <div className="p-4 mb-4 bg-red-900/50 text-red-400 rounded-lg">{lbError}</div>}

        <div className="space-y-2">
          {lbLoading ? (
            <div className="animate-pulse space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white/50 dark:bg-zinc-900/50 shadow-sm rounded-xl"></div>)}
            </div>
          ) : entries.length > 0 ? (
            <AnimatePresence mode="popLayout">
            {entries.map((entry) => {
              const initial = entry.username.charAt(0).toUpperCase();
              const hue = entry.username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360;
              const isMe = entry.user_id === user?.id;

              return (
                <motion.div
                  layout
                  key={entry.user_id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: "spring", bounce: 0.2 }}
                >
                <Card 
                  className={`flex items-center justify-between p-5 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm shadow-sm border-2 rounded-xl ${
                    isMe ? 'border-primary-200 dark:border-primary-900/50 bg-primary-50/50 dark:bg-primary-900/10' : 'border-zinc-100 dark:border-zinc-800/50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      entry.rank === 1 ? 'bg-amber-100 text-amber-600' : 
                      entry.rank === 2 ? 'bg-slate-200 text-slate-600' :
                      entry.rank === 3 ? 'bg-orange-100 text-orange-600' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500'
                    }`}>
                      {entry.rank}
                    </div>
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-lg shadow-sm"
                      style={{ backgroundColor: `hsl(${hue}, 70%, 50%)` }}
                    >
                      {initial}
                    </div>
                    <div className="font-bold text-zinc-900 dark:text-zinc-50 text-lg">
                      {entry.username} {isMe && <span className="text-sm text-primary-500 font-medium ml-1">(Ty)</span>}
                    </div>
                  </div>
                  <div className="text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
                    {formatValue(entry.value, activeCategory)}
                  </div>
                </Card>
                </motion.div>
              );
            })}
            </AnimatePresence>
          ) : (
            <div className="text-center text-zinc-400 dark:text-zinc-500 py-12 bg-white/50 dark:bg-zinc-900/50 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
              <span className="text-4xl mb-4 block">👻</span>
              <h2 className="text-lg font-bold text-zinc-700 dark:text-zinc-300 mb-1">Pusty ranking</h2>
              <p>Dodaj znajomych, aby rozpocząć rywalizację!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
