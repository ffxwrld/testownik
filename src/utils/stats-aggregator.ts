import { loadAllSessions } from './session';
import { SyncStatsInput } from '../models/social';


export async function aggregateLocalStats(): Promise<SyncStatsInput> {
  const sessionsDict = await loadAllSessions();
  const sessions = Object.values(sessionsDict);

  let total_xp = 0;
  let total_sessions = 0;
  let total_questions = 0;
  let total_correct_first = 0;
  let total_study_seconds = 0;
  
  const activeDates = new Set<string>();

  for (const session of sessions) {
    if (session.phase === 'summary') {
      total_sessions += 1;
    }
    
    // XP: 10 per correct first attempt, 5 per completed session
    const sessionXp = (session.totalFirstCorrect || 0) * 10 + (session.phase === 'summary' ? 5 : 0);
    total_xp += sessionXp;
    
    total_questions += (session.totalFirstAttempts || 0);
    total_correct_first += (session.totalFirstCorrect || 0);
    total_study_seconds += (session.elapsedSeconds || 0);

    if (session.startedAt) {
      const dateString = new Date(session.startedAt).toISOString().split('T')[0];
      activeDates.add(dateString);
    }
  }

  const { currentStreak, longestStreak, lastStudyDate } = calculateStreaks(Array.from(activeDates));

  return {
    total_xp,
    total_sessions,
    total_questions,
    total_correct_first,
    total_study_seconds,
    current_streak: currentStreak,
    longest_streak: longestStreak,
    last_study_date: lastStudyDate,
  };
}

export function calculateStreaks(dates: string[]): { currentStreak: number; longestStreak: number; lastStudyDate: string | null } {
  if (dates.length === 0) return { currentStreak: 0, longestStreak: 0, lastStudyDate: null };

  const sortedDates = dates.sort();
  const lastStudyDate = sortedDates[sortedDates.length - 1];

  let longestStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(sortedDates[i - 1]);
    const curr = new Date(sortedDates[i]);
    const diffTime = Math.abs(curr.getTime() - prev.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      currentStreak++;
      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
      }
    } else {
      currentStreak = 1;
    }
  }

  // Check if current streak is still active (studied today or yesterday)
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  if (lastStudyDate !== today && lastStudyDate !== yesterday) {
    currentStreak = 0; // Streak broken
  }

  return {
    currentStreak: currentStreak > 0 ? currentStreak : 0,
    longestStreak,
    lastStudyDate
  };
}
