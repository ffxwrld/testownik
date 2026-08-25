import React, { useState } from 'react';
import { useLeaderboard } from '../../hooks/useLeaderboard';
import { LeaderboardCategory } from '../../models/social';
import { Card } from '../ui/Card';
import { useAuth } from '../../hooks/useAuth';

const categories: { id: LeaderboardCategory; label: string; icon: string }[] = [
  { id: 'xp', label: 'Punkty XP', icon: '🏆' },
  { id: 'accuracy', label: 'Poprawność', icon: '🎯' },
  { id: 'sessions', label: 'Sesje', icon: '📚' },
  { id: 'streak', label: 'Streak', icon: '🔥' },
  { id: 'study_time', label: 'Czas', icon: '⏱️' }
];

export const LeaderboardView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [activeCategory, setActiveCategory] = useState<LeaderboardCategory>('xp');
  const { entries, loading, error } = useLeaderboard(activeCategory);
  const { user } = useAuth();

  const formatValue = (value: number, category: LeaderboardCategory) => {
    switch (category) {
      case 'accuracy': return `${value}%`;
      case 'study_time': return `${Math.round(value / 60)} min`;
      case 'streak': return `${value} dni`;
      default: return value.toString();
    }
  };

  return (
    <div className="flex-1 bg-gradient-to-b from-zinc-100 to-zinc-50 dark:from-zinc-900 dark:to-zinc-950 text-zinc-900 dark:text-zinc-50 p-6 flex flex-col items-center overflow-y-auto">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between mb-8">
          <button onClick={onBack} className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Powrót
          </button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <svg className="w-6 h-6 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Ranking
          </h1>
          <div className="w-20"></div>
        </div>

        <div className="flex overflow-x-auto gap-2 mb-6 pb-2 hide-scrollbar">
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full font-medium transition-colors ${
                activeCategory === c.id 
                  ? 'bg-primary-600 text-white shadow-lg' 
                  : 'bg-white dark:bg-zinc-900 shadow-sm text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:bg-zinc-800'
              }`}
            >
              <span className="mr-2">{c.icon}</span>
              {c.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="p-4 mb-4 bg-red-900/50 text-red-400 rounded-lg">{error}</div>
        )}

        <div className="space-y-2">
          {loading ? (
            <div className="animate-pulse space-y-2">
              {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-16 bg-white dark:bg-zinc-900 shadow-sm rounded-xl"></div>)}
            </div>
          ) : entries.length > 0 ? (
            entries.map((entry) => {
              const initial = entry.username.charAt(0).toUpperCase();
              const hue = entry.username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360;
              const isMe = entry.user_id === user?.id;

              return (
                <Card 
                  key={entry.user_id} 
                  className={`flex items-center justify-between p-4 bg-white dark:bg-zinc-900 shadow-sm border ${
                    isMe ? 'border-primary-500 shadow-md shadow-primary-500/10' : 'border-zinc-200 dark:border-zinc-800'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      entry.rank === 1 ? 'bg-amber-400 text-amber-900' : 
                      entry.rank === 2 ? 'bg-slate-300 text-slate-800' :
                      entry.rank === 3 ? 'bg-amber-600 text-amber-100' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                    }`}>
                      {entry.rank}
                    </div>
                    
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm"
                      style={{ backgroundColor: `hsl(${hue}, 70%, 50%)` }}
                    >
                      {initial}
                    </div>
                    
                    <div className="font-bold text-zinc-900 dark:text-zinc-50">
                      {entry.username} {isMe && <span className="text-xs text-primary-600 dark:text-primary-400 font-normal ml-1">(Ty)</span>}
                    </div>
                  </div>
                  
                  <div className="text-xl font-black text-zinc-900 dark:text-zinc-50">
                    {formatValue(entry.value, activeCategory)}
                  </div>
                </Card>
              );
            })
          ) : (
            <div className="text-center text-zinc-400 dark:text-zinc-500 py-12 bg-white dark:bg-zinc-900 shadow-sm/50 rounded-xl border border-zinc-200 dark:border-zinc-800/50">
              <svg className="w-12 h-12 mx-auto text-zinc-400 dark:text-zinc-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <h3 className="text-lg font-medium text-zinc-700 dark:text-zinc-300 mb-1">Pusty ranking</h3>
              <p>Zaproś znajomych, aby rozpocząć rywalizację!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
