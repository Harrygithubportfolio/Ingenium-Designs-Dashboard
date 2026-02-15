-- ============================================
-- MIGRATION 010: Focus / Pomodoro Sessions
-- Run this in the Supabase SQL Editor (data project)
-- Safe to re-run — all statements use IF NOT EXISTS
-- ============================================

DO $$ BEGIN CREATE TYPE focus_session_status AS ENUM ('active', 'completed', 'abandoned'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS focus_sessions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               TEXT NOT NULL,
  status                focus_session_status NOT NULL DEFAULT 'active',
  focus_minutes         SMALLINT NOT NULL DEFAULT 25,
  break_minutes         SMALLINT NOT NULL DEFAULT 5,
  total_pomodoros       SMALLINT NOT NULL DEFAULT 4,
  completed_pomodoros   SMALLINT NOT NULL DEFAULT 0,
  total_focus_seconds   INTEGER NOT NULL DEFAULT 0,
  label                 TEXT,
  spotify_playlist_uri  TEXT,
  started_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at              TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_focus_sessions_user ON focus_sessions(user_id, started_at DESC);

ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'focus_sessions' AND policyname = 'Users manage own focus sessions'
  ) THEN
    CREATE POLICY "Users manage own focus sessions" ON focus_sessions
      FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);
  END IF;
END $$;
