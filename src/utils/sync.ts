import { supabase } from '../lib/supabase';
import { SyncStatsSchema } from '../lib/validation';
import { aggregateLocalStats } from './stats-aggregator';
import { SyncResult } from '../models/social';

let syncInProgress = false;
let lastSyncTime = 0;
const SYNC_COOLDOWN_MS = 10000; // 10 seconds

/**
 * Aggregates all local sessions and pushes the totals to Supabase.
 * Returns early if offline, unauthenticated, or called too frequently.
 * Designed to be fire-and-forget.
 */
export async function syncStatsToServer(): Promise<SyncResult | null> {
  // 1. Basic checks
  if (!navigator.onLine) {
    return { success: false, error: { code: 'OFFLINE', message: 'Urządzenie jest offline' } };
  }

  if (syncInProgress) {
    return null; // Ignore if already syncing
  }

  const now = Date.now();
  if (now - lastSyncTime < SYNC_COOLDOWN_MS) {
    return null; // Rate limited
  }

  // 2. Check auth
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return null; // Not logged in, nothing to sync
  }

  syncInProgress = true;
  try {
    // 3. Aggregate
    const stats = await aggregateLocalStats();
    
    // 4. Validate
    const parsed = SyncStatsSchema.safeParse(stats);
    if (!parsed.success) {
      console.error('[Sync] Validation failed:', parsed.error);
      return { success: false, error: { code: 'VALIDATION', message: 'Nieprawidłowe dane statystyk' } };
    }

    // 5. Upsert
    const { data, error } = await supabase
      .from('user_stats')
      .upsert({ 
        user_id: session.user.id, 
        ...parsed.data,
      })
      .select()
      .single();

    if (error) throw error;
    
    lastSyncTime = Date.now();
    return { success: true, data: data as any };
  } catch (err: any) {
    console.error('[Sync] Failed:', err);
    return { success: false, error: { code: 'NETWORK', message: err.message || 'Błąd sieci' } };
  } finally {
    syncInProgress = false;
  }
}
