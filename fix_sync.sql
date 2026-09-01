CREATE OR REPLACE FUNCTION public.sync_user_session_stats(
  p_xp_gained INTEGER,
  p_questions_answered INTEGER,
  p_correct_answers INTEGER,
  p_study_seconds INTEGER,
  p_sessions_completed INTEGER,
  p_pack_id TEXT DEFAULT NULL,
  p_pack_name TEXT DEFAULT NULL
) RETURNS void AS $$
DECLARE
  v_user_id UUID;
  v_today DATE := CURRENT_DATE;
  
  -- Clamp values to prevent abuse
  clamped_xp INTEGER := LEAST(GREATEST(p_xp_gained, 0), 5000);
  clamped_q INTEGER := LEAST(GREATEST(p_questions_answered, 0), 2000);
  clamped_c INTEGER := LEAST(GREATEST(p_correct_answers, 0), clamped_q);
  clamped_s INTEGER := LEAST(GREATEST(p_study_seconds, 0), 28800); -- Max 8h per sync
  clamped_sess INTEGER := LEAST(GREATEST(p_sessions_completed, 0), 100);
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 1. Zaktualizuj tablicę globalną
  UPDATE public.user_stats
  SET 
    total_xp = total_xp + clamped_xp,
    total_questions = total_questions + clamped_q,
    total_correct_first = total_correct_first + clamped_c,
    total_study_seconds = total_study_seconds + clamped_s,
    total_sessions = total_sessions + clamped_sess,
    updated_at = NOW()
  WHERE user_id = v_user_id;

  IF NOT FOUND THEN
    INSERT INTO public.user_stats (user_id, total_xp, total_questions, total_correct_first, total_study_seconds, total_sessions)
    VALUES (v_user_id, clamped_xp, clamped_q, clamped_c, clamped_s, clamped_sess);
  END IF;

  -- 2. Dziennik aktywności dzisiejszy (UPSERT)
  INSERT INTO public.user_activity_logs (
    user_id, log_date, xp_gained, study_seconds, questions_answered, correct_answers, sessions_completed
  )
  VALUES (
    v_user_id, v_today, clamped_xp, clamped_s, clamped_q, clamped_c, clamped_sess
  )
  ON CONFLICT (user_id, log_date) DO UPDATE SET
    xp_gained = public.user_activity_logs.xp_gained + EXCLUDED.xp_gained,
    study_seconds = public.user_activity_logs.study_seconds + EXCLUDED.study_seconds,
    questions_answered = public.user_activity_logs.questions_answered + EXCLUDED.questions_answered,
    correct_answers = public.user_activity_logs.correct_answers + EXCLUDED.correct_answers,
    sessions_completed = public.user_activity_logs.sessions_completed + EXCLUDED.sessions_completed;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
