import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation, Link } from 'wouter';
import { useProfile } from '../hooks/useProfile';
import { useUserStats, calculateLevel } from '../hooks/useUserStats';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { getAllSessionMetadata } from '../utils/session';
import { SavedSessionMetadata } from '../models/types';
import { Play, Flame, Target } from 'lucide-react';

interface DashboardViewProps {
  onStartSession: (sessionId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onStartSession }) => {
  const [] = useLocation();
  const { profile } = useProfile();
  const { stats } = useUserStats();
  const { entries: friendsLeaderboard } = useLeaderboard('xp');

  const levelInfo = stats ? calculateLevel(stats.total_xp) : { level: 1, currentLevelXp: 0, nextLevelXp: 1250, progress: 0, xpToNextLevel: 1250 };
  
  const [savedSessions, setSavedSessions] = useState<SavedSessionMetadata[]>([]);
  
  useEffect(() => {
    getAllSessionMetadata().then(setSavedSessions);
  }, []);
  
  const recentSessions = useMemo(() => {
    return [...savedSessions]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);
  }, [savedSessions]);


  
  const overallAccuracy = stats && stats.total_questions > 0 
    ? Math.round((stats.total_correct_first / stats.total_questions) * 100) 
    : 0;

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}min`;
    return `${m}min`;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: typeof window !== 'undefined' && window.innerWidth > 768 ? 0.05 : 0 } }
  } as any;

  const itemVariants = {
    hidden: { opacity: 0, y: 15, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", bounce: 0.2, duration: 0.4 } }
  } as any;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 md:px-8 py-8 pb-32 md:pb-12 space-y-6">
      
      {/* HEADER WITH INTEGRATED STATS */}
      <motion.div 
        variants={containerVariants} 
        initial="hidden" 
        animate="visible"
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-[radial-gradient(circle,var(--color-primary-500)_0%,transparent_70%)] opacity-10 rounded-full -mr-20 -mt-20 pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row gap-6 md:items-end justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Cześć, {profile?.username || 'Użytkowniku'}!</h1>
              <span className="text-2xl">👋</span>
            </div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Masz <strong className="text-zinc-900 dark:text-zinc-200">{stats?.total_sessions || 0}</strong> ukończonych sesji, a Twój łączny czas nauki to <strong className="text-zinc-900 dark:text-zinc-200">{formatTime(stats?.total_study_seconds || 0)}</strong>.
            </p>
          </div>
          
          <div className="flex items-center gap-4 bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-2xl border border-zinc-100 dark:border-zinc-700/50">
            <div className="text-center px-2">
              <div className="text-xl font-bold text-orange-500 flex items-center justify-center gap-1">
                <Flame className="w-5 h-5 text-orange-500" fill="currentColor" /> {stats?.current_streak || 0}
              </div>
              <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Passa dni</div>
            </div>
            <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-700"></div>
            <div className="text-center px-2">
              <div className="text-xl font-bold text-emerald-500 flex items-center justify-center gap-1">
                <Target className="w-5 h-5 text-emerald-500" strokeWidth={2.5} /> {overallAccuracy}%
              </div>
              <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Celność</div>
            </div>
          </div>
        </div>

        <div className="relative z-10 bg-zinc-50 dark:bg-zinc-800/30 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center justify-between text-sm font-bold text-zinc-600 dark:text-zinc-400 mb-3">
            <span className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 flex items-center justify-center text-xs">
                {levelInfo.level}
              </span>
              <span className="text-primary-600 dark:text-primary-400">Poziom {levelInfo.level}</span>
            </span>
            <span>{levelInfo.currentLevelXp} / {levelInfo.nextLevelXp} XP</span>
          </div>
          <div className="h-3 w-full bg-zinc-200 dark:bg-zinc-700/50 rounded-full overflow-hidden shadow-inner">
            <motion.div 
              className="h-full bg-primary-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${levelInfo.progress}%` }}
              transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            />
          </div>
        </div>
      </motion.div>

      {/* HERO CARD: LAST TEST */}
      {recentSessions.length > 0 && (
        <motion.div variants={itemVariants} className="bg-primary-50 dark:bg-primary-900/10 border-2 border-primary-100 dark:border-primary-800/30 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 shadow-sm">
          <div className="flex-1 w-full">
            <span className="text-xs font-bold tracking-widest uppercase text-primary-600 dark:text-primary-400 mb-2 block">
              Ostatnio ćwiczono
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2 truncate">
              {recentSessions[0].baseName}
            </h2>
            <div className="flex items-center gap-4 text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-4">
              <span>{recentSessions[0].totalQuestions} pytań</span>
              <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600"></span>
              <span>
                {new Date(recentSessions[0].updatedAt).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}
              </span>
            </div>
            
            <div className="w-full max-w-sm">
              <div className="flex justify-between text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1.5">
                <span>Skuteczność</span>
                <span className="text-primary-600 dark:text-primary-400">{Math.round((recentSessions[0].completedQuestions / (recentSessions[0].totalQuestions || 1)) * 100)}%</span>
              </div>
              <div className="h-2 w-full bg-primary-200/50 dark:bg-primary-900/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary-500 rounded-full"
                  style={{ width: `${Math.round((recentSessions[0].completedQuestions / (recentSessions[0].totalQuestions || 1)) * 100)}%` }}
                />
              </div>
            </div>
          </div>
          <div className="w-full md:w-auto">
            <button 
              onClick={() => onStartSession(recentSessions[0].id)}
              className="w-full md:w-auto flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 px-8 rounded-2xl shadow-xl shadow-primary-600/20 transition active:scale-[0.97]"
            >
              <Play className="w-5 h-5 fill-current" />
              Kontynuuj naukę
            </button>
          </div>
        </motion.div>
      )}

      {/* GRID SECTION: OLDER PACKS & RANKING */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2 space-y-4">
          <div className="space-y-4 mb-6">
            <div className="px-1">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Aktywność 7 dni</h2>
            </div>
            <motion.div variants={itemVariants} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 sm:p-5 flex justify-between gap-1 sm:gap-2 shadow-sm overflow-x-auto hide-scrollbar">
              {(() => {
                const activeDates = new Set<string>();
                const today = new Date();
                savedSessions.forEach(s => {
                  const d = new Date(s.updatedAt);
                  const diffDays = Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
                  if (diffDays < 7 && diffDays >= 0) {
                    activeDates.add(d.toISOString().slice(0, 10));
                  }
                });

                const dayLabels = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd'];
                const mondayOffset = (today.getDay() + 6) % 7;
                const monday = new Date(today);
                monday.setDate(today.getDate() - mondayOffset);
                monday.setHours(0, 0, 0, 0);

                return dayLabels.map((label, i) => {
                  const day = new Date(monday);
                  day.setDate(monday.getDate() + i);
                  const dateStr = day.toISOString().slice(0, 10);
                  const isActive = activeDates.has(dateStr);
                  const isFuture = day > today;

                  return (
                    <div key={label} className="flex flex-col items-center gap-2">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-colors ${
                        isFuture
                          ? 'bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-100 dark:border-zinc-800/50 text-transparent'
                          : isActive 
                            ? 'bg-indigo-50 dark:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 shadow-inner' 
                            : 'bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 text-transparent'
                      }`}>
                        {isActive && <span className="text-sm">✓</span>}
                      </div>
                      <span className={`text-[10px] font-semibold ${isFuture ? 'text-zinc-300 dark:text-zinc-700' : 'text-zinc-500'}`}>{label}</span>
                    </div>
                  );
                });
              })()}
            </motion.div>
          </div>
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Inne testy</h2>
            <Link href="/nauka" className="text-sm font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 transition">
              Wszystkie &gt;
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentSessions.slice(1, 5).length > 0 ? (
              recentSessions.slice(1, 5).map((session) => {
                const dateStr = new Date(session.updatedAt).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' });
                return (
                  <motion.button type="button"
                    style={{ minWidth: 0 }}
                    variants={itemVariants}
                    key={session.id}
                    className="text-left w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors rounded-2xl overflow-hidden flex flex-col group shadow-sm hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                    onClick={() => onStartSession(session.id)}
                  >
                    <div className="p-4 flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                          Paczka
                        </span>
                        <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 group-hover:bg-primary-600 group-hover:text-white text-zinc-500 dark:text-zinc-400 flex items-center justify-center transition-colors">
                          <Play className="w-4 h-4 ml-0.5" />
                        </div>
                      </div>
                      <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mb-1 truncate">{session.baseName}</h4>
                      <p className="text-xs text-zinc-500">{session.totalQuestions} pytań • {dateStr}</p>
                    </div>
                  </motion.button>
                )
              })
            ) : (
              <div className="col-span-2 py-8 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Brak starszych paczek.</p>
              </div>
            )}
          </div>
        </div>

        {/* SIDEBAR: RANKING */}
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Ranking</h2>
              <Link href="/ranking" className="text-sm font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 transition">
                Pełny &gt;
              </Link>
            </div>
            <motion.div variants={itemVariants} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
              {friendsLeaderboard.slice(0, 5).map((entry) => {
                const hue = entry.username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360;
                return (
                  <div key={entry.user_id} className="flex items-center gap-3 py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                    <span className="w-5 text-center text-xs font-bold text-zinc-500">{entry.rank}</span>
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: `hsl(${hue}, 70%, 50%)` }}
                    >
                      {entry.username.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">{entry.username}</div>
                      <div className="text-[10px] text-zinc-500 font-medium">{entry.value} XP</div>
                    </div>
                  </div>
                );
              })}
              {friendsLeaderboard.length === 0 && (
                <div className="text-center py-4 text-zinc-500 text-sm">
                  Brak użytkowników w rankingu
                </div>
              )}
            </motion.div>
          </div>

          

        </div>

      </div>
    </div>
  );
};

export default DashboardView;
