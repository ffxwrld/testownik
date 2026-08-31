import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, BookOpen, Flame, Target, Sparkles, Clock, Snowflake } from 'lucide-react';

import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';
import { useProfile } from '../../hooks/useProfile';
import { useSync } from '../../hooks/useSync';
import { supabase } from '../../lib/supabase';
import { UserStats } from '../../models/social';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export const ProfileView: React.FC = () => {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const { triggerSync, buyStreakFreeze } = useSync();
  const [syncing, setSyncing] = useState(false);
  const [stats, setStats] = useState<UserStats | null>(null);

  const loadStats = async () => {
    if (!user) return;
    const { data } = await supabase.from('user_stats').select('user_id, total_xp, total_sessions, total_questions, total_correct_first, total_study_seconds, current_streak, longest_streak, last_study_date').eq('user_id', user.id).single();
    if (data) setStats(data as UserStats);
  };

  useEffect(() => {
    loadStats();
  }, [user]);

  const handleSync = async () => {
    setSyncing(true);
    await triggerSync();
    await loadStats();
    setSyncing(false);
    toast.success("Synchronizacja zakończona");
  };

  if (!profile) return null;

  const initial = profile.username.charAt(0).toUpperCase();
  const colorHash = profile.username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue = colorHash % 360;
  const avatarStyle = { backgroundColor: `hsl(${hue}, 70%, 50%)` };

  return (
    <div className="flex-1 bg-transparent text-zinc-900 dark:text-zinc-50 p-6 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between mb-8 mt-2">
          <h1 className="text-3xl font-bold tracking-tight">Twój Profil</h1>
          <Button variant="danger" onClick={signOut}>Wyloguj się</Button>
        </div>

        <Card className="mb-6 bg-white dark:bg-zinc-900 shadow-sm border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-6">
            <div 
              className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-lg flex-shrink-0"
              style={avatarStyle}
            >
              {initial}
            </div>
            <div>
              <h2 className="text-3xl font-bold">{profile.username}</h2>
              <p className="text-zinc-500 dark:text-zinc-400">{user?.email}</p>
              <div className="mt-2 text-sm text-zinc-400 dark:text-zinc-500">
                Dołączył(a): {new Date(profile.created_at).toLocaleDateString('pl-PL')}
              </div>
            </div>
          </div>
        </Card>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Twoje statystyki</h2>
          <Button 
            variant="secondary" 
            onClick={handleSync} 
            disabled={syncing}
            className="flex items-center gap-2"
          >
            <svg className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {syncing ? 'Synchronizacja...' : 'Synchronizuj'}
          </Button>
        </div>

        <motion.div 
          className="grid grid-cols-2 md:grid-cols-3 gap-4"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.05 }
            }
          }}
        >
          <StatCard title={t('social.profile.xp')} value={stats ? stats.total_xp : '-'} icon={<Trophy className="w-6 h-6 text-yellow-500" strokeWidth={1.5} />} />
          <StatCard title={t('social.profile.sessions')} value={stats ? stats.total_sessions : '-'} icon={<BookOpen className="w-6 h-6 text-blue-500" strokeWidth={1.5} />} />
          <StatCard title={t('social.profile.streak')} value={stats ? t('social.profile.days', { count: stats.current_streak }) : '-'} icon={<Flame className="w-6 h-6 text-orange-500" strokeWidth={1.5} fill="currentColor" />} />
          <StatCard title={t('social.profile.questions')} value={stats ? stats.total_questions : '-'} icon={<Target className="w-6 h-6 text-emerald-500" strokeWidth={1.5} />} />
          <StatCard title={t('social.profile.correct')} value={stats ? stats.total_correct_first : '-'} icon={<Sparkles className="w-6 h-6 text-purple-500" strokeWidth={1.5} />} />
          <StatCard title={t('social.profile.time')} value={stats ? t('social.profile.minutes', { count: Math.round(stats.total_study_seconds / 60) }) : '-'} icon={<Clock className="w-6 h-6 text-sky-500" strokeWidth={1.5} />} />
          <StatCard title="Zamrożenia" value={stats ? stats.streak_freezes : '-'} icon={<Snowflake className="w-6 h-6 text-cyan-500" strokeWidth={1.5} />} />
        </motion.div>

        {stats && (
          <div className="mt-8 flex justify-center">
            <Card className="bg-white dark:bg-zinc-900 border-primary-100 dark:border-primary-900 shadow-sm p-5 text-center">
              <h2 className="text-lg font-bold mb-2 flex items-center justify-center gap-2">
                <Snowflake className="w-6 h-6 text-cyan-500" /> Zamrożenie Serii
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4 max-w-sm">
                Kup zamrożenie serii, aby uchronić swój streak przed wyzerowaniem w razie 1 dnia nieobecności.
                Koszt: <span className="font-bold text-amber-500">1000 XP</span>
              </p>
              <Button 
                variant="primary" 
                disabled={stats.total_xp < 1000 || syncing}
                onClick={async () => {
                  setSyncing(true);
                  const res = await buyStreakFreeze();
                  if (res.success) {
                    toast.success("Zakupiono zamrożenie!");
                    loadStats();
                  } else {
                    toast.error(res.error?.message || "Błąd zakupu");
                  }
                  setSyncing(false);
                }}
              >
                Kup zamrożenie
              </Button>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: React.ReactNode; icon: React.ReactNode }> = ({ title, value, icon }) => (
  <motion.div 
    variants={{
      hidden: { opacity: 0, y: 10, scale: 0.95 },
      visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2, ease: [0.23, 1, 0.32, 1] } }
    }}
    className="bg-white dark:bg-zinc-900 shadow-sm border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl flex flex-col items-center justify-center text-center"
  >
    <span className="text-zinc-400 dark:text-zinc-500 mb-3">{icon}</span>
    <span className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">{title}</span>
    <span className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{value}</span>
  </motion.div>
);
