-- ============================================
-- MIGRATION 012: Body Measurements
-- Run this in the Supabase SQL Editor (tvbemlwkphnvmsromqha)
-- Safe to re-run — all statements use IF NOT EXISTS
-- ============================================

CREATE TABLE IF NOT EXISTS body_measurements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT NOT NULL,
  measured_date   DATE NOT NULL,
  weight_kg       NUMERIC(5,2),
  height_cm       NUMERIC(5,1),
  body_fat_pct    NUMERIC(4,1),
  chest_cm        NUMERIC(5,1),
  waist_cm        NUMERIC(5,1),
  hips_cm         NUMERIC(5,1),
  left_arm_cm     NUMERIC(5,1),
  right_arm_cm    NUMERIC(5,1),
  left_thigh_cm   NUMERIC(5,1),
  right_thigh_cm  NUMERIC(5,1),
  neck_cm         NUMERIC(5,1),
  shoulders_cm    NUMERIC(5,1),
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT body_measurements_unique UNIQUE (user_id, measured_date)
);

CREATE INDEX IF NOT EXISTS idx_body_measurements_user ON body_measurements(user_id, measured_date DESC);

ALTER TABLE body_measurements ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'body_measurements' AND policyname = 'Users manage own measurements'
  ) THEN
    CREATE POLICY "Users manage own measurements" ON body_measurements
      FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);
  END IF;
END $$;
