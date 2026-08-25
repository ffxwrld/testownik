-- ═══════════════════════════════════════════════════════════
-- PROFILES
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username    TEXT UNIQUE NOT NULL
              CHECK (length(username) BETWEEN 3 AND 30)
              CHECK (username ~ '^[a-zA-Z0-9_]+$'),
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_profiles_username ON public.profiles(username);

-- ═══════════════════════════════════════════════════════════
-- USER_STATS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.user_stats (
  user_id               UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  total_xp              INTEGER DEFAULT 0 NOT NULL CHECK (total_xp >= 0),
  total_sessions        INTEGER DEFAULT 0 NOT NULL CHECK (total_sessions >= 0),
  total_questions       INTEGER DEFAULT 0 NOT NULL CHECK (total_questions >= 0),
  total_correct_first   INTEGER DEFAULT 0 NOT NULL CHECK (total_correct_first >= 0),
  total_study_seconds   INTEGER DEFAULT 0 NOT NULL CHECK (total_study_seconds >= 0),
  current_streak        INTEGER DEFAULT 0 NOT NULL CHECK (current_streak >= 0),
  longest_streak        INTEGER DEFAULT 0 NOT NULL CHECK (longest_streak >= 0),
  last_study_date       DATE,
  updated_at            TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_user_stats_xp ON public.user_stats(total_xp DESC);
CREATE INDEX idx_user_stats_sessions ON public.user_stats(total_sessions DESC);
CREATE INDEX idx_user_stats_streak ON public.user_stats(current_streak DESC);

-- ═══════════════════════════════════════════════════════════
-- FRIENDSHIPS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.friendships (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  addressee_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at    TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at    TIMESTAMPTZ DEFAULT now() NOT NULL,

  UNIQUE(requester_id, addressee_id),
  CHECK (requester_id <> addressee_id)
);

CREATE INDEX idx_friendships_requester_accepted
  ON public.friendships(requester_id) WHERE status = 'accepted';
CREATE INDEX idx_friendships_addressee_accepted
  ON public.friendships(addressee_id) WHERE status = 'accepted';
CREATE INDEX idx_friendships_addressee_pending
  ON public.friendships(addressee_id) WHERE status = 'pending';

-- ═══════════════════════════════════════════════════════════
-- RLS POLICIES
-- ═══════════════════════════════════════════════════════════

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view any profile"
  ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- User Stats: visible to self + accepted friends only
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stats"
  ON public.user_stats FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Friends can view stats"
  ON public.user_stats FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.friendships
      WHERE status = 'accepted'
      AND (
        (requester_id = auth.uid() AND addressee_id = user_id)
        OR (addressee_id = auth.uid() AND requester_id = user_id)
      )
    )
  );

CREATE POLICY "Users can upsert own stats"
  ON public.user_stats FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Friendships
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own friendships"
  ON public.friendships FOR SELECT TO authenticated
  USING (requester_id = auth.uid() OR addressee_id = auth.uid());

CREATE POLICY "Users can send friend requests"
  ON public.friendships FOR INSERT TO authenticated
  WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Addressee can update friendship status"
  ON public.friendships FOR UPDATE TO authenticated
  USING (addressee_id = auth.uid());

CREATE POLICY "Users can delete own friendships"
  ON public.friendships FOR DELETE TO authenticated
  USING (requester_id = auth.uid() OR addressee_id = auth.uid());

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_modtime
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_user_stats_modtime
BEFORE UPDATE ON public.user_stats
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_friendships_modtime
BEFORE UPDATE ON public.friendships
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
