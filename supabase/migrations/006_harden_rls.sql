-- ═══════════════════════════════════════════════════════════
-- HARDEN RLS: Prevent direct mutations to stats to stop cheating
-- ═══════════════════════════════════════════════════════════

-- 1. Revoke direct upsert on user_stats
DROP POLICY IF EXISTS "Users can upsert own stats" ON public.user_stats;

-- 2. Revoke direct insert/update on user_activity_logs
DROP POLICY IF EXISTS "Users can insert their own logs" ON public.user_activity_logs;
DROP POLICY IF EXISTS "Users can update their own logs" ON public.user_activity_logs;

-- Note: The SECURITY DEFINER RPC `sync_user_session_stats` will still be able to 
-- bypass these restrictions and write to the tables safely while clamping values.
