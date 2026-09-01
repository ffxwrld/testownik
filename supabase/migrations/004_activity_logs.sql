-- Tabela do zapisywania dziennej aktywności
CREATE TABLE public.user_activity_logs (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  xp_gained INTEGER DEFAULT 0 NOT NULL CHECK (xp_gained >= 0),
  study_seconds INTEGER DEFAULT 0 NOT NULL CHECK (study_seconds >= 0),
  questions_answered INTEGER DEFAULT 0 NOT NULL CHECK (questions_answered >= 0),
  correct_answers INTEGER DEFAULT 0 NOT NULL CHECK (correct_answers >= 0),
  sessions_completed INTEGER DEFAULT 0 NOT NULL CHECK (sessions_completed >= 0),
  PRIMARY KEY (user_id, log_date)
);

ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all activity logs" 
  ON public.user_activity_logs FOR SELECT USING (true);
CREATE POLICY "Users can insert their own logs" 
  ON public.user_activity_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own logs" 
  ON public.user_activity_logs FOR UPDATE USING (auth.uid() = user_id);

-- Aktualizacja procedury synchronizacyjnej, by pisała również do dziennika!
CREATE OR REPLACE FUNCTION public.sync_user_session_stats(
  p_xp_gained INTEGER,
  p_questions_answered INTEGER,
  p_correct_answers INTEGER,
  p_study_seconds INTEGER,
  p_completed_session BOOLEAN,
  p_pack_id TEXT DEFAULT NULL,
  p_pack_name TEXT DEFAULT NULL
) RETURNS void AS $$
DECLARE
  v_user_id UUID;
  v_today DATE := CURRENT_DATE;
  v_sessions_completed_inc INTEGER := 0;
  
  -- Clamp values to prevent abuse
  clamped_xp INTEGER := LEAST(GREATEST(p_xp_gained, 0), 1000);
  clamped_q INTEGER := LEAST(GREATEST(p_questions_answered, 0), 500);
  clamped_c INTEGER := LEAST(GREATEST(p_correct_answers, 0), clamped_q);
  clamped_s INTEGER := LEAST(GREATEST(p_study_seconds, 0), 14400); -- Max 4h per sync
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_completed_session THEN
    v_sessions_completed_inc := 1;
  END IF;

  -- 1. Zaktualizuj tablicę globalną (stara logika)
  UPDATE public.user_stats
  SET 
    total_xp = total_xp + clamped_xp,
    total_questions = total_questions + clamped_q,
    total_correct_first = total_correct_first + clamped_c,
    total_study_seconds = total_study_seconds + clamped_s,
    total_sessions = total_sessions + v_sessions_completed_inc,
    updated_at = NOW()
  WHERE user_id = v_user_id;

  IF NOT FOUND THEN
    INSERT INTO public.user_stats (user_id, total_xp, total_questions, total_correct_first, total_study_seconds, total_sessions)
    VALUES (v_user_id, clamped_xp, clamped_q, clamped_c, clamped_s, v_sessions_completed_inc);
  END IF;

  -- 2. Dziennik aktywności dzisiejszy (UPSERT)
  INSERT INTO public.user_activity_logs (
    user_id, log_date, xp_gained, study_seconds, questions_answered, correct_answers, sessions_completed
  )
  VALUES (
    v_user_id, v_today, clamped_xp, clamped_s, clamped_q, clamped_c, v_sessions_completed_inc
  )
  ON CONFLICT (user_id, log_date) DO UPDATE SET
    xp_gained = public.user_activity_logs.xp_gained + EXCLUDED.xp_gained,
    study_seconds = public.user_activity_logs.study_seconds + EXCLUDED.study_seconds,
    questions_answered = public.user_activity_logs.questions_answered + EXCLUDED.questions_answered,
    correct_answers = public.user_activity_logs.correct_answers + EXCLUDED.correct_answers,
    sessions_completed = public.user_activity_logs.sessions_completed + EXCLUDED.sessions_completed;

  -- Tutaj w przyszłości można dodać zapisywanie per_pack statystyk (user_packs)
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Funkcja: Pobieranie aktywności dla wykresów na Pulpit z ostatnich 7 dni
CREATE OR REPLACE FUNCTION public.get_user_activity_7d(p_user_id UUID)
RETURNS TABLE (
  log_date DATE,
  xp_gained INTEGER,
  study_seconds INTEGER,
  questions_answered INTEGER,
  correct_answers INTEGER,
  sessions_completed INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.log_date, l.xp_gained, l.study_seconds, l.questions_answered, l.correct_answers, l.sessions_completed
  FROM public.user_activity_logs l
  WHERE l.user_id = p_user_id
    AND l.log_date >= CURRENT_DATE - INTERVAL '6 days'
  ORDER BY l.log_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Funkcja: Nowy Leaderboard (All time, 7 days, 30 days)
CREATE OR REPLACE FUNCTION public.get_leaderboard_v2(p_time_range TEXT)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  avatar_url TEXT,
  total_xp BIGINT,
  total_study_seconds BIGINT
) AS $$
BEGIN
  IF p_time_range = 'all_time' THEN
    RETURN QUERY
    SELECT 
      u.user_id, p.username, p.avatar_url, 
      u.total_xp::BIGINT, u.total_study_seconds::BIGINT
    FROM public.user_stats u
    JOIN public.profiles p ON p.id = u.user_id
    ORDER BY u.total_xp DESC
    LIMIT 100;
  
  ELSIF p_time_range = '7_days' THEN
    RETURN QUERY
    SELECT 
      l.user_id, p.username, p.avatar_url,
      COALESCE(SUM(l.xp_gained), 0)::BIGINT as total_xp,
      COALESCE(SUM(l.study_seconds), 0)::BIGINT as total_study_seconds
    FROM public.user_activity_logs l
    JOIN public.profiles p ON p.id = l.user_id
    WHERE l.log_date >= CURRENT_DATE - INTERVAL '7 days'
    GROUP BY l.user_id, p.username, p.avatar_url
    ORDER BY total_xp DESC
    LIMIT 100;
    
  ELSIF p_time_range = '30_days' THEN
    RETURN QUERY
    SELECT 
      l.user_id, p.username, p.avatar_url,
      COALESCE(SUM(l.xp_gained), 0)::BIGINT as total_xp,
      COALESCE(SUM(l.study_seconds), 0)::BIGINT as total_study_seconds
    FROM public.user_activity_logs l
    JOIN public.profiles p ON p.id = l.user_id
    WHERE l.log_date >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY l.user_id, p.username, p.avatar_url
    ORDER BY total_xp DESC
    LIMIT 100;
    
  ELSE
    RAISE EXCEPTION 'Invalid time range. Use all_time, 7_days, or 30_days.';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

