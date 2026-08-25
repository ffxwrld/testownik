import { useState, useEffect, useCallback } from 'react';
import { getLeaderboard } from '../utils/leaderboard';
import { LeaderboardCategory, LeaderboardEntry } from '../models/social';
import { useAuth } from './useAuth';

export function useLeaderboard(category: LeaderboardCategory) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getLeaderboard(category);
      setEntries(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, category]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return {
    entries,
    loading,
    error,
    refreshLeaderboard: fetchLeaderboard
  };
}
