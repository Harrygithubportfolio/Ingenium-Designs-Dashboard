-- ============================================
-- MIGRATION 006: Quick Capture / Inbox
-- Run this in the Supabase SQL Editor (data project)
-- Safe to re-run — all statements use IF NOT EXISTS
-- ============================================

CREATE TABLE IF NOT EXISTS inbox_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT NOT NULL,
  content       TEXT NOT NULL,
  item_type     TEXT NOT NULL DEFAULT 'thought',
  is_processed  BOOLEAN NOT NULL DEFAULT false,
  processed_at  TIMESTAMPTZ,
  routed_to     TEXT,
  routed_id     TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inbox_items_user ON inbox_items(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inbox_items_unprocessed ON inbox_items(user_id, is_processed) WHERE is_processed = false;

ALTER TABLE inbox_items ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'inbox_items' AND policyname = 'Users manage own inbox'
  ) THEN
    CREATE POLICY "Users manage own inbox" ON inbox_items
      FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);
  END IF;
END $$;
