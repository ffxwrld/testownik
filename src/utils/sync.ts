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
    
    // Find sessions that are completed but NOT synced yet
    const unsyncedIds = Object.keys(allSessions).filter(
      id => allSessions[id].phase === 'summary' && !allSessions[id].synced
    );

    if (unsyncedIds.length === 0) {
      // Nothing to sync, return success early
      syncInProgress = false;
      return null;
    }

    // 1. Calculate unsynced deltas
    let sessionXpGained = 0;
    let sessionsCount = 0;
    let questionsAnswered = 0;
    let correctFirst = 0;
    let secondsSpent = 0;

    for (const id of unsyncedIds) {
      const s = allSessions[id];
      sessionsCount += 1;
      const sessionXp = (s.totalFirstCorrect || 0) * 10 + 5; // 5 bonus for completing
      sessionXpGained += sessionXp;
      questionsAnswered += (s.totalFirstAttempts || 0);
      correctFirst += (s.totalFirstCorrect || 0);
      secondsSpent += (s.elapsedSeconds || 0);
    }

    // 2. Call RPC to sync safely on backend
    const { data, error } = await supabase.rpc('sync_user_session_stats', {
      p_xp_gained: sessionXpGained,
      p_sessions_count: sessionsCount,
      p_questions_answered: questionsAnswered,
      p_correct_first: correctFirst,
      p_seconds_spent: secondsSpent
    });

    if (error) throw error;

    // 3. Mark local sessions as synced
    for (const id of unsyncedIds) {
      allSessions[id].synced = true;
    }
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
