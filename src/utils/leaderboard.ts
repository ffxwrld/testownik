import { supabase } from '../lib/supabase';
import { LeaderboardCategory, LeaderboardEntry } from '../models/social';

export async function getLeaderboard(category: LeaderboardCategory): Promise<LeaderboardEntry[]> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error('Not authenticated');

  // We want to fetch stats for the current user AND their friends.
  // Because of RLS, we can just select all stats from 'user_stats' 
  // and the DB will automatically filter out people who aren't our accepted friends!
  // This is the power of Row Level Security.
  
  let orderColumn = '';
  switch (category) {
    case 'xp': orderColumn = 'total_xp'; break;
    case 'accuracy': orderColumn = 'total_correct_first'; /* Needs custom logic for % */ break;
    case 'sessions': orderColumn = 'total_sessions'; break;
    case 'study_time': orderColumn = 'total_study_seconds'; break;
    case 'streak': orderColumn = 'current_streak'; break;
  }

  const { data, error } = await supabase
    .from('user_stats')
    .select(`
      user_id,
      total_xp,
      total_sessions,
      total_questions,
      total_correct_first,
      total_study_seconds,
      current_streak,
      profiles ( username, avatar_url )
    `)
    // If not accuracy, we can order directly in DB. 
    // If accuracy, we have to fetch and sort in memory.
    .order(category !== 'accuracy' ? orderColumn : 'total_questions', { ascending: false });

  if (error) throw error;

  // Process data
  let entries = data.map((row: any) => {
    let value = 0;
    if (category === 'accuracy') {
      value = row.total_questions > 0 
        ? Math.round((row.total_correct_first / row.total_questions) * 100) 
        : 0;
    } else {
      value = row[orderColumn] || 0;
    }

    return {
      rank: 0,
      user_id: row.user_id,
      username: row.profiles.username,
      avatar_url: row.profiles.avatar_url,
      value
    } as LeaderboardEntry;
  });

  if (category === 'accuracy') {
    entries.sort((a, b) => b.value - a.value);
  }

  // Assign ranks
  entries.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  return entries;
}
