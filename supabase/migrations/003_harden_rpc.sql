-- Harden RPC for syncing stats with anti-cheat sanity checks
CREATE OR REPLACE FUNCTION public.sync_user_session_stats(
  p_xp_gained INTEGER,
  p_sessions_count INTEGER,
  p_questions_answered INTEGER,
  p_correct_first INTEGER,
  p_seconds_spent INTEGER
) RETURNS json AS $$
DECLARE
  v_stats public.user_stats%ROWTYPE;
  v_diff_days INTEGER;
  v_freezes_needed INTEGER;
  v_today DATE := CURRENT_DATE;
  
  -- Anti-cheat variables
  v_clamped_xp INTEGER;
  v_clamped_sessions INTEGER;
  v_clamped_questions INTEGER;
  v_clamped_correct INTEGER;
  v_clamped_seconds INTEGER;
BEGIN
  -- Basic sanity checks / Anti-cheat clamps
  -- Prevent massive arbitrary stat injection (DoS/Leaderboard poisoning)
  v_clamped_xp := LEAST(GREATEST(p_xp_gained, 0), 100000);
  v_clamped_sessions := LEAST(GREATEST(p_sessions_count, 0), 1000);
  v_clamped_questions := LEAST(GREATEST(p_questions_answered, 0), 10000);
  v_clamped_correct := LEAST(GREATEST(p_correct_first, 0), 10000);
  v_clamped_seconds := LEAST(GREATEST(p_seconds_spent, 0), 86400 * 7); -- max 1 week of seconds

  -- Lock the row for update to prevent concurrent modification issues
  SELECT * INTO v_stats FROM public.user_stats WHERE user_id = auth.uid() FOR UPDATE;
  
  IF NOT FOUND THEN
    INSERT INTO public.user_stats (
      user_id, total_xp, total_sessions, total_questions, total_correct_first, 
      total_study_seconds, current_streak, longest_streak, last_study_date, streak_freezes
    ) VALUES (
      auth.uid(), v_clamped_xp, v_clamped_sessions, v_clamped_questions, v_clamped_correct,
      v_clamped_seconds, 1, 1, v_today, 0
    ) RETURNING * INTO v_stats;
    RETURN row_to_json(v_stats);
  END IF;

  -- Accumulate stats
  v_stats.total_xp := v_stats.total_xp + v_clamped_xp;
  v_stats.total_sessions := v_stats.total_sessions + v_clamped_sessions;
  v_stats.total_questions := v_stats.total_questions + v_clamped_questions;
  v_stats.total_correct_first := v_stats.total_correct_first + v_clamped_correct;
  v_stats.total_study_seconds := v_stats.total_study_seconds + v_clamped_seconds;

  -- Process Streaks if the user completed sessions
  IF v_clamped_sessions > 0 THEN
    IF v_stats.last_study_date IS NULL THEN
      v_stats.current_streak := 1;
      v_stats.longest_streak := GREATEST(v_stats.longest_streak, 1);
      v_stats.last_study_date := v_today;
    ELSE
      v_diff_days := (v_today - v_stats.last_study_date);

      IF v_diff_days = 1 THEN
        -- Perfect streak continuation
        v_stats.current_streak := v_stats.current_streak + 1;
        v_stats.longest_streak := GREATEST(v_stats.longest_streak, v_stats.current_streak);
        v_stats.last_study_date := v_today;
      ELSIF v_diff_days > 1 THEN
        -- Missed days. Do we have enough freezes?
        v_freezes_needed := v_diff_days - 1;
        IF v_stats.streak_freezes >= v_freezes_needed THEN
          v_stats.streak_freezes := v_stats.streak_freezes - v_freezes_needed;
          v_stats.current_streak := v_stats.current_streak + 1;
          v_stats.longest_streak := GREATEST(v_stats.longest_streak, v_stats.current_streak);
          v_stats.last_study_date := v_today;
        ELSE
          -- Streak broken
          v_stats.current_streak := 1;
          v_stats.last_study_date := v_today;
        END IF;
      END IF;
      -- If v_diff_days <= 0, they already studied today (or system clock is weird), do nothing to streak.
    END IF;
  END IF;

  -- Save back
  UPDATE public.user_stats 
  SET 
    total_xp = v_stats.total_xp,
    total_sessions = v_stats.total_sessions,
    total_questions = v_stats.total_questions,
    total_correct_first = v_stats.total_correct_first,
    total_study_seconds = v_stats.total_study_seconds,
    current_streak = v_stats.current_streak,
    longest_streak = v_stats.longest_streak,
    last_study_date = v_stats.last_study_date,
    streak_freezes = v_stats.streak_freezes,
    updated_at = NOW()
  WHERE user_id = auth.uid();

  RETURN row_to_json(v_stats);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
