-- ============================================
-- MIGRATION 009: AI Daily Briefings
-- Run this in the Supabase SQL Editor (data project)
-- Safe to re-run — all statements use IF NOT EXISTS
-- ============================================

-- Extend insight_type enum
DO $$ BEGIN ALTER TYPE insight_type ADD VALUE IF NOT EXISTS 'daily_briefing'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE insight_type ADD VALUE IF NOT EXISTS 'weekly_summary'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS daily_briefings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT NOT NULL,
  briefing_date   DATE NOT NULL,
  briefing_type   TEXT NOT NULL DEFAULT 'morning',
  content         TEXT NOT NULL,
  data_context    JSONB,
  model_used      TEXT,
  generated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT daily_briefings_unique UNIQUE (user_id, briefing_date, briefing_type)
);

CREATE INDEX IF NOT EXISTS idx_daily_briefings_user ON daily_briefings(user_id, briefing_date DESC);

ALTER TABLE daily_briefings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'daily_briefings' AND policyname = 'Users manage own briefings'
  ) THEN
    CREATE POLICY "Users manage own briefings" ON daily_briefings
      FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);
  END IF;
END $$;
