import useSWR from 'swr';
import { getLeaderboard, LeaderboardTimeRange } from '../utils/leaderboard';
import { LeaderboardEntry } from '../models/social';
import { useAuth } from './useAuth';

export function useLeaderboard(timeRange: LeaderboardTimeRange) {
  const { user } = useAuth();

  const {
    data: entries = [],
    error,
    isLoading,
    mutate
  } = useSWR<LeaderboardEntry[]>(
    user ? ['leaderboard_v2', timeRange] : null,
    ([, range]) => getLeaderboard(range as LeaderboardTimeRange),
    { refreshInterval: 60000 }
  );

  return {
    entries,
    loading: isLoading,
    error: error ? error.message : null,
    refreshLeaderboard: mutate
  };
}
