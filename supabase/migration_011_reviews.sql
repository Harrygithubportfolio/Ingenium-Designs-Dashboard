-- ============================================
-- MIGRATION 011: Weekly/Monthly Reviews
-- Run this in the Supabase SQL Editor (data project)
-- Safe to re-run — all statements use IF NOT EXISTS
-- ============================================

CREATE TABLE IF NOT EXISTS review_snapshots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT NOT NULL,
  period_type     TEXT NOT NULL,
  period_start    DATE NOT NULL,
  period_end      DATE NOT NULL,
  metrics         JSONB NOT NULL DEFAULT '{}',
  ai_summary      TEXT,
  is_viewed       BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT review_snapshots_unique UNIQUE (user_id, period_type, period_start)
);

CREATE INDEX IF NOT EXISTS idx_review_snapshots_user ON review_snapshots(user_id, period_start DESC);

ALTER TABLE review_snapshots ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'review_snapshots' AND policyname = 'Users manage own reviews'
  ) THEN
    CREATE POLICY "Users manage own reviews" ON review_snapshots
      FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);
  END IF;
END $$;
