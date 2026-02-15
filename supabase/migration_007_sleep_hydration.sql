-- ============================================
-- MIGRATION 007: Sleep & Hydration Tracking
-- Run this in the Supabase SQL Editor (data project)
-- Safe to re-run — all statements use IF NOT EXISTS
-- ============================================

CREATE TABLE IF NOT EXISTS sleep_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT NOT NULL,
  log_date      DATE NOT NULL,
  hours_slept   NUMERIC(4,2) NOT NULL,
  quality       SMALLINT NOT NULL DEFAULT 3,
  bed_time      TIME,
  wake_time     TIME,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT sleep_logs_unique UNIQUE (user_id, log_date),
  CONSTRAINT sleep_logs_quality_range CHECK (quality >= 1 AND quality <= 5),
  CONSTRAINT sleep_logs_hours_range CHECK (hours_slept >= 0 AND hours_slept <= 24)
);

CREATE INDEX IF NOT EXISTS idx_sleep_logs_user_date ON sleep_logs(user_id, log_date DESC);

CREATE TABLE IF NOT EXISTS hydration_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT NOT NULL,
  log_date      DATE NOT NULL,
  total_ml      INTEGER NOT NULL DEFAULT 0,
  target_ml     INTEGER NOT NULL DEFAULT 2500,
  entries       JSONB NOT NULL DEFAULT '[]',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT hydration_logs_unique UNIQUE (user_id, log_date),
  CONSTRAINT hydration_logs_positive CHECK (total_ml >= 0)
);

CREATE INDEX IF NOT EXISTS idx_hydration_logs_user_date ON hydration_logs(user_id, log_date DESC);

-- RLS
ALTER TABLE sleep_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE hydration_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'sleep_logs' AND policyname = 'Users manage own sleep logs'
  ) THEN
    CREATE POLICY "Users manage own sleep logs" ON sleep_logs
      FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'hydration_logs' AND policyname = 'Users manage own hydration logs'
  ) THEN
    CREATE POLICY "Users manage own hydration logs" ON hydration_logs
      FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);
  END IF;
END $$;
