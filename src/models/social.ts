// Branded types for type safety
export type UserId = string & { readonly __brand: 'UserId' };
export type FriendshipId = string & { readonly __brand: 'FriendshipId' };

// Output types (from server)
export interface UserProfile {
  id: UserId;
  username: string;
  avatar_url: string | null;
  created_at: string;
}

export interface UserStats {
  user_id: UserId;
  total_xp: number;
  total_sessions: number;
  total_questions: number;
  total_correct_first: number;
  total_study_seconds: number;
  current_streak: number;
  longest_streak: number;
  last_study_date: string | null;
  streak_freezes: number;
}

export interface Friendship {
  id: FriendshipId;
  requester_id: UserId;
  addressee_id: UserId;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
}

// Input types (to server)
export interface CreateProfileInput {
  username: string;
}

export interface SyncStatsInput {
  total_xp: number;
  total_sessions: number;
  total_questions: number;
  total_correct_first: number;
  total_study_seconds: number;
  current_streak: number;
  longest_streak: number;
  last_study_date: string | null;
}

// Discriminated union for sync result
export type SyncResult =
  | { success: true; data: UserStats }
  | { success: false; error: { code: string; message: string } };

// Leaderboard
export type LeaderboardCategory = 'xp' | 'accuracy' | 'sessions' | 'study_time' | 'streak';

export interface LeaderboardEntry {
  rank: number;
  user_id: UserId;
  username: string;
  avatar_url: string | null;
  value: number;
}
