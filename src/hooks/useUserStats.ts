import useSWR from 'swr';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { UserStats } from '../models/social';

export function useUserStats() {
  const { user } = useAuth();

  const fetchStats = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_stats')
      .select('user_id, total_xp, total_sessions, total_questions, total_correct_first, total_study_seconds, current_streak, longest_streak, last_study_date, streak_freezes')
      .eq('user_id', userId)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null; // no stats yet
      throw error;
    }
    return data as UserStats;
  };

  const {
    data: stats = null,
    isLoading,
    mutate
  } = useSWR<UserStats | null>(
    user ? ['user_stats', user.id] : null,
    ([, userId]) => fetchStats(userId as string)
  );

  return { stats, loading: isLoading, refreshStats: mutate };
}

export function calculateLevel(xp: number) {
  const XP_PER_LEVEL = 1250;
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const currentLevelXp = xp % XP_PER_LEVEL;
  const nextLevelXp = XP_PER_LEVEL;
  const progress = (currentLevelXp / nextLevelXp) * 100;
  
  return {
    level,
    currentLevelXp,
    nextLevelXp,
    xpToNextLevel: nextLevelXp - currentLevelXp,
    progress
  };
}
