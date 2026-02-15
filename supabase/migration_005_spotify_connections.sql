-- ============================================
-- MIGRATION 005: Spotify Connections
-- ============================================
-- Stores encrypted Spotify OAuth tokens per user.
-- Follows the same pattern as calendar_connections.

CREATE TABLE IF NOT EXISTS spotify_connections (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          TEXT NOT NULL UNIQUE,
  access_token     TEXT NOT NULL,
  refresh_token    TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  spotify_user_id  TEXT,
  display_name     TEXT,
  product          TEXT DEFAULT 'free',
  is_active        BOOLEAN DEFAULT true,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- RLS: users can only access their own row
ALTER TABLE spotify_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own spotify connection"
  ON spotify_connections
  FOR ALL
  USING (auth.uid()::text = user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_spotify_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_spotify_updated_at
  BEFORE UPDATE ON spotify_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_spotify_updated_at();
