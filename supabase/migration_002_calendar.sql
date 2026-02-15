-- ============================================
-- CALENDAR SYSTEM — DATABASE MIGRATION
-- Run this in the Supabase SQL Editor (data project)
-- Safe to re-run — all statements use IF NOT EXISTS
-- ============================================

-- ==================
-- CALENDAR EVENTS
-- ==================

CREATE TABLE IF NOT EXISTS calendar_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT NOT NULL,
  source          TEXT NOT NULL DEFAULT 'local',       -- 'local' | 'google'
  google_event_id TEXT,                                -- Google Calendar event ID (null for local)
  title           TEXT NOT NULL,
  description     TEXT,
  event_date      DATE NOT NULL,
  start_time      TIME,
  end_time        TIME,
  location        TEXT,
  is_all_day      BOOLEAN NOT NULL DEFAULT false,
  category        TEXT NOT NULL DEFAULT 'general',
  colour          TEXT,                                -- hex colour for display
  google_etag     TEXT,                                -- Google etag for conflict detection
  is_deleted      BOOLEAN NOT NULL DEFAULT false,      -- soft delete for sync
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_calendar_events_user_date ON calendar_events(user_id, event_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_google_id ON calendar_events(google_event_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_source ON calendar_events(source);

-- ==================
-- CALENDAR CONNECTIONS (OAuth tokens)
-- ==================

CREATE TABLE IF NOT EXISTS calendar_connections (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          TEXT NOT NULL,
  provider         TEXT NOT NULL DEFAULT 'google',
  access_token     TEXT NOT NULL,                      -- encrypted at rest
  refresh_token    TEXT NOT NULL,                      -- encrypted at rest
  token_expires_at TIMESTAMPTZ NOT NULL,
  calendar_id      TEXT NOT NULL DEFAULT 'primary',    -- Google calendar ID
  sync_token       TEXT,                               -- Google incremental sync token
  last_synced_at   TIMESTAMPTZ,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT calendar_connections_user_provider_unique UNIQUE (user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_calendar_connections_user ON calendar_connections(user_id);

-- ==================
-- CALENDAR SYNC LOG (audit trail)
-- ==================

CREATE TABLE IF NOT EXISTS calendar_sync_log (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          TEXT NOT NULL,
  direction        TEXT NOT NULL,  -- 'pull' | 'push'
  status           TEXT NOT NULL,  -- 'success' | 'error' | 'conflict'
  events_processed INTEGER DEFAULT 0,
  error_message    TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_calendar_sync_log_user ON calendar_sync_log(user_id, created_at DESC);

-- ==================
-- ROW LEVEL SECURITY
-- ==================

ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_sync_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own calendar events" ON calendar_events;
CREATE POLICY "Users manage own calendar events" ON calendar_events
  FOR ALL USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users manage own calendar connections" ON calendar_connections;
CREATE POLICY "Users manage own calendar connections" ON calendar_connections
  FOR ALL USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users manage own sync logs" ON calendar_sync_log;
CREATE POLICY "Users manage own sync logs" ON calendar_sync_log
  FOR ALL USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);
