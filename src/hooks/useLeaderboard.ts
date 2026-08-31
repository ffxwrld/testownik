import useSWR from 'swr';
import { getLeaderboard } from '../utils/leaderboard';
import { LeaderboardCategory, LeaderboardEntry } from '../models/social';
import { useAuth } from './useAuth';

export function useLeaderboard(category: LeaderboardCategory) {
  const { user } = useAuth();

  const {
    data: entries = [],
    error,
    isLoading,
    mutate
  } = useSWR<LeaderboardEntry[]>(
    user ? ['leaderboard', category] : null,
    ([, cat]) => getLeaderboard(cat as LeaderboardCategory),
    { refreshInterval: 60000 }
  );

  return {
    entries,
    loading: isLoading,
    error: error ? error.message : null,
    refreshLeaderboard: mutate
  };
}
