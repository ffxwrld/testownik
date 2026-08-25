import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useProfile } from '../../hooks/useProfile';
import { useSync } from '../../hooks/useSync';
import { supabase } from '../../lib/supabase';
import { UserStats } from '../../models/social';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export const ProfileView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const { triggerSync } = useSync();
  const [syncing, setSyncing] = useState(false);
  const [stats, setStats] = useState<UserStats | null>(null);

  const loadStats = async () => {
    if (!user) return;
    const { data } = await supabase.from('user_stats').select('*').eq('user_id', user.id).single();
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
  };

  if (!profile) return null;

  const initial = profile.username.charAt(0).toUpperCase();
  const colorHash = profile.username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue = colorHash % 360;
  const avatarStyle = { backgroundColor: `hsl(${hue}, 70%, 50%)` };

  return (
    <div className="flex-1 bg-gradient-to-b from-zinc-100 to-zinc-50 dark:from-zinc-900 dark:to-zinc-950 text-zinc-900 dark:text-zinc-50 p-6 flex flex-col items-center overflow-y-auto">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={onBack}
            className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Powrót
          </button>
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
              <h1 className="text-3xl font-bold">{profile.username}</h1>
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

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard title="Punkty XP" value={stats ? stats.total_xp : '-'} icon="🏆" />
          <StatCard title="Ukończone Sesje" value={stats ? stats.total_sessions : '-'} icon="📚" />
          <StatCard title="Obecny Streak" value={stats ? `${stats.current_streak} dni` : '-'} icon="🔥" />
          <StatCard title="Rozwiązane Pytania" value={stats ? stats.total_questions : '-'} icon="🎯" />
          <StatCard title="Poprawne (1. raz)" value={stats ? stats.total_correct_first : '-'} icon="✨" />
          <StatCard title="Czas nauki" value={stats ? `${Math.round(stats.total_study_seconds / 60)} min` : '-'} icon="⏱️" />
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: React.ReactNode; icon: string }> = ({ title, value, icon }) => (
  <div className="bg-white dark:bg-zinc-900 shadow-sm border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl flex flex-col items-center justify-center text-center">
    <span className="text-2xl mb-2">{icon}</span>
    <span className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">{title}</span>
    <span className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{value}</span>
  </div>
);
