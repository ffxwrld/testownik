import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation, Link } from 'wouter';
import { useTranslation } from 'react-i18next';
import { useProfile } from '../hooks/useProfile';
import { useUserStats } from '../hooks/useUserStats';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { getAllSessionMetadata } from '../utils/session';
import { SavedSessionMetadata } from '../models/types';
import { Play, Target, ArrowCounterClockwise, SquaresFour } from '@phosphor-icons/react';
import { differenceInCalendarDays, parseISO, startOfDay } from 'date-fns';
import { PageHeader } from './common/PageHeader';

interface DashboardViewProps {
  onStartSession: (sessionId: string) => void;
  onResetSession: (sessionId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onStartSession, onResetSession }) => {
  const [] = useLocation();
  const { t, i18n } = useTranslation();
  const { profile } = useProfile();
  const { stats } = useUserStats();
  const { entries: friendsLeaderboard } = useLeaderboard('all_time');
  
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

  const today = startOfDay(new Date());
  const primarySession = recentSessions.find(s => s.targetDate && parseISO(s.targetDate) >= today) || recentSessions[0];
  let daysLeft: number | null = null;
  let dailyGoal: number | null = null;
  let questionsLeft: number = 0;
  
  if (primarySession && primarySession.targetDate) {
    const target = parseISO(primarySession.targetDate);
    daysLeft = Math.max(0, differenceInCalendarDays(target, today));
    
    questionsLeft = Math.max(0, primarySession.totalQuestions - primarySession.completedQuestions);
    dailyGoal = daysLeft > 0 ? Math.ceil(questionsLeft / daysLeft) : questionsLeft;
  }

  const localeStr = i18n.language === 'en' ? 'en-US' : 'pl-PL';

  return (
    <div className="w-full max-w-5xl mx-auto px-4 md:px-8 py-8 pb-32 md:pb-12 space-y-8">
      
      {/* PAGE HEADER */}
      <PageHeader
        icon={<SquaresFour />}
        title={t('dashboard.greeting', { name: profile?.username || (i18n.language === 'en' ? 'User' : 'Użytkowniku') })}
        subtitle={
          <span>
            {t('social.profile.sessions')}: <strong className="text-zinc-900 dark:text-zinc-200">{stats?.total_sessions || 0}</strong> • {t('dashboard.studyTime')}: <strong className="text-zinc-900 dark:text-zinc-200">{formatTime(stats?.total_study_seconds || 0)}</strong>
          </span>
        }
      >
        <div className="flex items-center gap-2 bg-zinc-100/80 dark:bg-zinc-800/80 px-3.5 py-1.5 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60 shadow-xs">
          <Target className="w-4 h-4 text-emerald-500" strokeWidth={2.5} />
          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{overallAccuracy}%</span>
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{t('dashboard.accuracy')}</span>
        </div>
      </PageHeader>

      {daysLeft !== null && dailyGoal !== null ? (
        <div className="bg-primary-50/50 dark:bg-primary-950/30 p-5 rounded-2xl border border-primary-200/60 dark:border-primary-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-sm shadow-xs">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 mb-1">{t('dashboard.examGoal')}</div>
            <div className="text-lg md:text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {t('dashboard.untilExam')}{' '}
              <span className="text-primary-600 dark:text-primary-400">{primarySession.baseName}</span>{' '}
              {daysLeft === 1 ? t('dashboard.daysRemaining_one', { count: 1 }) : t('dashboard.daysRemaining_few', { count: daysLeft })}!
            </div>
          </div>
          <div className="flex items-baseline md:flex-col md:items-end gap-1 flex-shrink-0">
            <span className="text-xs font-bold text-primary-700/80 dark:text-primary-300/80 uppercase tracking-wider">{t('dashboard.dailyGoal')}</span>
            <span className="text-2xl md:text-3xl font-black text-primary-950 dark:text-primary-100 tabular-nums">
              {dailyGoal} <span className="text-sm font-semibold opacity-75">{t('dashboard.questionsPerDay', { count: dailyGoal }).replace(/^[0-9]+\s*/, '')}</span>
            </span>
          </div>
        </div>
      ) : recentSessions.length === 0 ? (
        <div className="bg-zinc-50/80 dark:bg-zinc-800/40 p-5 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 text-center flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
          <div className="text-left">
            <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{t('dashboard.noTests')}</div>
            <div className="text-xs font-medium text-zinc-500 mt-0.5">{t('dashboard.noTestsDesc')}</div>
          </div>
          <Link href="/nauka" className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-sm font-semibold hover:opacity-90 active:scale-95 transition shadow-xs whitespace-nowrap">
            {t('dashboard.goToLearn')}
          </Link>
        </div>
      ) : null}

      {/* HERO CARD: LAST TEST */}
      {recentSessions.length > 0 && (
        <div 
          className="bg-white dark:bg-zinc-900 border border-primary-200/70 dark:border-primary-800/40 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 shadow-xs relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-primary-50/50 dark:from-primary-950/20 to-transparent pointer-events-none" />
          
          <div className="flex-1 w-full relative z-10">
            <span className="text-[11px] font-bold tracking-wider uppercase text-primary-600 dark:text-primary-400 mb-1.5 block">
              {t('dashboard.recentTests')}
            </span>
            <h2 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2 truncate">
              {recentSessions[0].baseName}
            </h2>
            <div className="flex items-center gap-3 text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-4">
              <span>{t('home.questionsCount', { count: recentSessions[0].totalQuestions })}</span>
              <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600"></span>
              <span>
                {new Date(recentSessions[0].updatedAt).toLocaleDateString(localeStr, { day: 'numeric', month: 'short' })}
              </span>
            </div>
            
            <div className="w-full max-w-sm">
              <div className="flex justify-between text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">
                <span>{t('dashboard.yourProgress')}</span>
                <span className="text-primary-600 dark:text-primary-400 font-bold tabular-nums">
                  {Math.round((recentSessions[0].completedQuestions / (recentSessions[0].totalQuestions || 1)) * 100)}%
                </span>
              </div>
              <div className="h-2 w-full bg-primary-100/70 dark:bg-primary-950/60 rounded-full overflow-hidden relative">
                <motion.div 
                  className="h-full bg-primary-600 dark:bg-primary-500 rounded-full relative overflow-hidden"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.round((recentSessions[0].completedQuestions / (recentSessions[0].totalQuestions || 1)) * 100)}%` }}
                  transition={{ type: 'spring', bounce: 0, duration: 0.8 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-shimmer" />
                </motion.div>
              </div>
            </div>
          </div>
          
          <div className="w-full md:w-auto relative z-10">
            {recentSessions[0].currentPhase === 'summary' || recentSessions[0].completedQuestions >= recentSessions[0].totalQuestions ? (
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: 'spring', bounce: 0, duration: 0.2 }}
                onClick={() => onResetSession(recentSessions[0].id)}
                className="w-full md:w-auto flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-900 text-white font-bold py-3.5 px-7 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <ArrowCounterClockwise className="w-4 h-4" />
                {t('sessionsList.startOver')}
              </motion.button>
            ) : (
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: 'spring', bounce: 0, duration: 0.2 }}
                onClick={() => onStartSession(recentSessions[0].id)}
                className="w-full md:w-auto flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3.5 px-7 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                {t('dashboard.continueLearning')}
              </motion.button>
            )}
          </div>
        </div>
      )}

      {/* GRID SECTION: OLDER PACKS & RANKING */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2 space-y-3">

          <div className="flex items-center justify-between px-1">
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">{t('dashboard.recentTests')}</h2>
            <Link href="/nauka" className="text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 transition">
              {t('dashboard.viewAll')} &gt;
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {recentSessions.slice(1, 5).length > 0 ? (
              recentSessions.slice(1, 5).map((session) => {
                const dateStr = new Date(session.updatedAt).toLocaleDateString(localeStr, { day: 'numeric', month: 'short' });
                return (
                  <button 
                    type="button"
                    style={{ minWidth: 0 }}
                    key={session.id}
                    className="text-left w-full bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 active:scale-[0.99] transition-[border-color,box-shadow,transform] duration-150 rounded-2xl overflow-hidden flex flex-col group shadow-xs cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                    onClick={() => onStartSession(session.id)}
                  >
                    <div className="p-4 flex-1">
                      <div className="flex items-start justify-between mb-2.5">
                        <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400">
                          {t('sessionsList.defaultBaseName')}
                        </span>
                        <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 group-hover:bg-primary-600 group-hover:text-white text-zinc-500 dark:text-zinc-400 flex items-center justify-center transition-colors">
                          <Play className="w-3.5 h-3.5 ml-0.5" />
                        </div>
                      </div>
                      <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mb-1 truncate">{session.baseName}</h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('home.questionsCount', { count: session.totalQuestions })} • {dateStr}</p>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="col-span-2 py-8 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">{t('sessionsList.emptyState')}</p>
              </div>
            )}
          </div>
        </div>

        {/* SIDEBAR: RANKING */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">{t('dashboard.leaderboard')}</h2>
            <Link href="/statystyki" className="text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 transition">
              {t('dashboard.fullLeaderboard')} &gt;
            </Link>
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-4 shadow-xs">
            {friendsLeaderboard.slice(0, 5).map((entry) => {
              const hue = entry.username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360;
              return (
                <div key={entry.user_id} className="flex items-center gap-3 py-2 border-b border-zinc-100 dark:border-zinc-800/60 last:border-0">
                  <div className="w-5 flex items-center justify-center flex-shrink-0">
                    {entry.rank === 1 ? (
                      <span className="w-5 h-5 rounded-full bg-amber-400 text-amber-950 text-[10px] font-black flex items-center justify-center shadow-xs">1</span>
                    ) : entry.rank === 2 ? (
                      <span className="w-5 h-5 rounded-full bg-zinc-300 dark:bg-zinc-600 text-zinc-900 dark:text-zinc-100 text-[10px] font-black flex items-center justify-center shadow-xs">2</span>
                    ) : entry.rank === 3 ? (
                      <span className="w-5 h-5 rounded-full bg-amber-700/80 text-white text-[10px] font-black flex items-center justify-center shadow-xs">3</span>
                    ) : (
                      <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 tabular-nums">{entry.rank}</span>
                    )}
                  </div>
                  <div 
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
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
                {t('social.leaderboard.emptyTitle')}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default DashboardView;
