import { supabase } from '../lib/supabase';

export interface DailyActivity {
  log_date: string;
  xp_gained: number;
  study_seconds: number;
  questions_answered: number;
  correct_answers: number;
  sessions_completed: number;
}

export async function getUserActivity7d(userId: string): Promise<DailyActivity[]> {
  const { data, error } = await supabase.rpc('get_user_activity_7d', { p_user_id: userId });
  
  if (error) throw error;
  
  return data as DailyActivity[];
}
