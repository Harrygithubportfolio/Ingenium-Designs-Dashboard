-- ============================================
-- Migration 016: Daily Focus, Reflections & Wellness Checks
-- Migrates focus/reflection data from localStorage to Supabase
-- and adds wellness check tracking for mindfulness features
-- ============================================

-- ============================================
-- TABLE: daily_focus
-- Stores the user's daily primary focus, supporting tasks, and intention
-- ============================================

CREATE TABLE IF NOT EXISTS daily_focus (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 TEXT NOT NULL,
  focus_date              DATE NOT NULL,
  primary_focus           TEXT NOT NULL,
  primary_focus_completed BOOLEAN NOT NULL DEFAULT false,
  supporting_tasks        JSONB NOT NULL DEFAULT '[]'::jsonb,
  intention_note          TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT daily_focus_user_date_unique UNIQUE (user_id, focus_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_focus_user_date
  ON daily_focus(user_id, focus_date DESC);

-- ============================================
-- TABLE: reflections
-- Stores the user's daily evening reflections
-- ============================================

CREATE TABLE IF NOT EXISTS reflections (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT NOT NULL,
  reflect_date  DATE NOT NULL,
  went_well     TEXT NOT NULL DEFAULT '',
  challenges    TEXT NOT NULL DEFAULT '',
  improvements  TEXT NOT NULL DEFAULT '',
  gratitude     TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT reflections_user_date_unique UNIQUE (user_id, reflect_date)
);

CREATE INDEX IF NOT EXISTS idx_reflections_user_date
  ON reflections(user_id, reflect_date DESC);

-- ============================================
-- TABLE: wellness_checks
-- Stores mood check-ins, stretch breaks, breathing and meditation sessions
-- ============================================

CREATE TABLE IF NOT EXISTS wellness_checks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      TEXT NOT NULL,
  check_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  check_type   TEXT NOT NULL,       -- 'mood' | 'stretch' | 'breathing' | 'meditation'
  mood_score   SMALLINT,            -- 1-5 scale, NULL if not a mood check
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT wellness_checks_user_date_type_unique UNIQUE (user_id, check_date, check_type)
);

CREATE INDEX IF NOT EXISTS idx_wellness_checks_user_date
  ON wellness_checks(user_id, check_date DESC);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE daily_focus ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE wellness_checks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'daily_focus'
    AND policyname = 'Users manage own daily focus'
  ) THEN
    CREATE POLICY "Users manage own daily focus" ON daily_focus
      FOR ALL USING (auth.uid()::text = user_id)
      WITH CHECK (auth.uid()::text = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'reflections'
    AND policyname = 'Users manage own reflections'
  ) THEN
    CREATE POLICY "Users manage own reflections" ON reflections
      FOR ALL USING (auth.uid()::text = user_id)
      WITH CHECK (auth.uid()::text = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'wellness_checks'
    AND policyname = 'Users manage own wellness checks'
  ) THEN
    CREATE POLICY "Users manage own wellness checks" ON wellness_checks
      FOR ALL USING (auth.uid()::text = user_id)
      WITH CHECK (auth.uid()::text = user_id);
  END IF;
END $$;
