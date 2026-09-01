import { supabase } from '../lib/supabase';
// Removed unused validation import
import { loadAllSessions } from './session';
import { set } from 'idb-keyval';
import { SyncResult, UserStats } from '../models/social';

let syncInProgress = false;
let lastSyncTime = 0;
const SYNC_COOLDOWN_MS = 5000;

export async function syncStatsToServer(): Promise<SyncResult | null> {
  if (!navigator.onLine) {
    return { success: false, error: { code: 'OFFLINE', message: 'Urządzenie jest offline' } };
  }

  if (syncInProgress) return null;

  const now = Date.now();
  if (now - lastSyncTime < SYNC_COOLDOWN_MS) return null;

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;

  syncInProgress = true;
  try {
    const allSessions = await loadAllSessions();
    
    // 1. Calculate unsynced deltas for ALL sessions (incremental tracking)
    let sessionXpGained = 0;
    let sessionsCount = 0;
    let questionsAnswered = 0;
    let correctFirst = 0;
    let secondsSpent = 0;

    let hasUpdates = false;

    for (const id in allSessions) {
      const s = allSessions[id];
      
      const currentSeconds = s.elapsedSeconds || 0;
      const syncedSec = s.syncedSeconds || 0;
      const deltaSeconds = currentSeconds - syncedSec;
      
      const currentCorrect = s.totalFirstCorrect || 0;
      const syncedCor = s.syncedCorrect || 0;
      const deltaCorrect = currentCorrect - syncedCor;
      
      const currentAnswers = s.totalFirstAttempts || 0;
      const syncedAns = s.syncedAnswers || 0;
      const deltaAnswers = currentAnswers - syncedAns;

      let deltaSessions = 0;
      if (s.phase === 'summary' && !s.synced) {
        deltaSessions = 1;
        s.synced = true;
        sessionXpGained += 5; // Completion bonus
      }

      if (deltaSeconds > 0 || deltaCorrect > 0 || deltaAnswers > 0 || deltaSessions > 0) {
        hasUpdates = true;
        
        secondsSpent += deltaSeconds;
        correctFirst += deltaCorrect;
        questionsAnswered += deltaAnswers;
        sessionXpGained += (deltaCorrect * 10);
        sessionsCount += deltaSessions;

        // Update markers
        s.syncedSeconds = currentSeconds;
        s.syncedCorrect = currentCorrect;
        s.syncedAnswers = currentAnswers;
      }
    }

    if (!hasUpdates) {
      syncInProgress = false;
      return null;
    }

    // 2. Call RPC to sync safely on backend
    const { data, error } = await supabase.rpc('sync_user_session_stats', {
      p_xp_gained: sessionXpGained,
      p_sessions_completed: sessionsCount,
      p_questions_answered: questionsAnswered,
      p_correct_answers: correctFirst,
      p_study_seconds: secondsSpent
    });

    if (error) throw error;

    // 3. Save markers back to IndexedDB
    await set('testownik_sessions_db', allSessions);
    
    lastSyncTime = Date.now();
    return { success: true, data: data as UserStats };
  } catch (err: any) {
    console.error('[Sync] Failed:', err);
    return { success: false, error: { code: 'NETWORK', message: err.message || 'Błąd sieci' } };
  } finally {
    syncInProgress = false;
  }
}

export async function buyStreakFreeze(): Promise<SyncResult> {
  if (!navigator.onLine) {
    return { success: false, error: { code: 'OFFLINE', message: 'Urządzenie jest offline' } };
  }

  try {
    const { data, error } = await supabase.rpc('buy_streak_freeze');
    if (error) throw error;
    return { success: true, data: data as UserStats };
  } catch (err: any) {
    console.error('[Sync] Failed to buy freeze:', err);
    return { success: false, error: { code: 'NETWORK', message: err.message || 'Błąd podczas zakupu' } };
  }
}
