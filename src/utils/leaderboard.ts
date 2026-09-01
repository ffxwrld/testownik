import { supabase } from '../lib/supabase';
import { LeaderboardEntry } from '../models/social';

export type LeaderboardTimeRange = '7_days' | '30_days' | 'all_time';

export async function getLeaderboard(timeRange: LeaderboardTimeRange): Promise<LeaderboardEntry[]> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error('Not authenticated');

  const { data, error } = await supabase.rpc('get_leaderboard_v2', { p_time_range: timeRange });

  if (error) throw error;

  let entries = data.map((row: any, index: number) => {
    return {
      rank: index + 1,
      user_id: row.user_id,
      username: row.username,
      avatar_url: row.avatar_url,
      value: row.total_xp // we use XP as the main ranking value
    } as LeaderboardEntry;
  });

  return entries;
}
