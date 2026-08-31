-- Add streak_freezes column to user_stats
ALTER TABLE public.user_stats ADD COLUMN streak_freezes INTEGER DEFAULT 0 NOT NULL CHECK (streak_freezes >= 0);

-- RPC for syncing stats with anti-cheat and freeze logic
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
BEGIN
  -- Lock the row for update to prevent concurrent modification issues
  SELECT * INTO v_stats FROM public.user_stats WHERE user_id = auth.uid() FOR UPDATE;
  
  IF NOT FOUND THEN
    INSERT INTO public.user_stats (
      user_id, total_xp, total_sessions, total_questions, total_correct_first, 
      total_study_seconds, current_streak, longest_streak, last_study_date, streak_freezes
    ) VALUES (
      auth.uid(), p_xp_gained, p_sessions_count, p_questions_answered, p_correct_first,
      p_seconds_spent, 1, 1, v_today, 0
    ) RETURNING * INTO v_stats;
    RETURN row_to_json(v_stats);
  END IF;

  -- Accumulate stats
  v_stats.total_xp := v_stats.total_xp + p_xp_gained;
  v_stats.total_sessions := v_stats.total_sessions + p_sessions_count;
  v_stats.total_questions := v_stats.total_questions + p_questions_answered;
  v_stats.total_correct_first := v_stats.total_correct_first + p_correct_first;
  v_stats.total_study_seconds := v_stats.total_study_seconds + p_seconds_spent;

  -- Process Streaks if the user completed sessions
  IF p_sessions_count > 0 THEN
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


-- RPC for buying a streak freeze
CREATE OR REPLACE FUNCTION public.buy_streak_freeze()
RETURNS json AS $$
DECLARE
  v_stats public.user_stats%ROWTYPE;
  v_cost INTEGER := 1000;
BEGIN
  SELECT * INTO v_stats FROM public.user_stats WHERE user_id = auth.uid() FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Brak statystyk użytkownika.';
  END IF;

  IF v_stats.total_xp < v_cost THEN
    RAISE EXCEPTION 'Niewystarczająca liczba punktów XP.';
  END IF;

  v_stats.total_xp := v_stats.total_xp - v_cost;
  v_stats.streak_freezes := v_stats.streak_freezes + 1;

  UPDATE public.user_stats
  SET 
    total_xp = v_stats.total_xp,
    streak_freezes = v_stats.streak_freezes,
    updated_at = NOW()
  WHERE user_id = auth.uid();

  RETURN row_to_json(v_stats);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
