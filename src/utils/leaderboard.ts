import { supabase } from '../lib/supabase';
import { LeaderboardEntry, UserId } from '../models/social';

export type LeaderboardTimeRange = '7_days' | '30_days' | 'all_time';

interface LeaderboardRpcRow {
  user_id: string;
  username: string;
  avatar_url?: string;
  total_xp: number;
}

export async function getLeaderboard(timeRange: LeaderboardTimeRange): Promise<LeaderboardEntry[]> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error('Not authenticated');

  const { data, error } = await supabase.rpc('get_leaderboard_v2', { p_time_range: timeRange });

  if (error) throw error;

  const rows = (data || []) as LeaderboardRpcRow[];
  const entries: LeaderboardEntry[] = rows.map((row, index) => ({
    rank: index + 1,
    user_id: row.user_id as UserId,
    username: row.username,
    avatar_url: row.avatar_url ?? null,
    value: row.total_xp,
  }));

  return entries;
}
