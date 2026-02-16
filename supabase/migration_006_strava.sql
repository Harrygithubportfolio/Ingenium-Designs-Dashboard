-- ============================================
-- MIGRATION 006: Strava Integration
-- ============================================
-- Stores encrypted Strava OAuth tokens and cached activity data.
-- Follows the same pattern as spotify_connections (migration 005).

-- ---- Strava Connections ----

CREATE TABLE IF NOT EXISTS strava_connections (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           TEXT NOT NULL UNIQUE,
  access_token      TEXT NOT NULL,          -- AES-256-GCM encrypted
  refresh_token     TEXT NOT NULL,          -- AES-256-GCM encrypted
  token_expires_at  TIMESTAMPTZ NOT NULL,
  strava_athlete_id TEXT,
  display_name      TEXT,
  profile_picture   TEXT,
  is_active         BOOLEAN DEFAULT true,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE strava_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own strava connection"
  ON strava_connections
  FOR ALL
  USING (auth.uid()::text = user_id);

CREATE OR REPLACE FUNCTION update_strava_connection_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_strava_connection_updated_at
  BEFORE UPDATE ON strava_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_strava_connection_updated_at();

-- ---- Strava Activities (cached, re-fetch within 7 days per API agreement) ----

CREATE TABLE IF NOT EXISTS strava_activities (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 TEXT NOT NULL,
  strava_id               BIGINT NOT NULL UNIQUE,
  name                    TEXT,
  sport_type              TEXT,
  start_date              TIMESTAMPTZ,
  distance_m              DOUBLE PRECISION,
  moving_time_sec         INT,
  elapsed_time_sec        INT,
  total_elevation_gain_m  DOUBLE PRECISION,
  average_speed_mps       DOUBLE PRECISION,
  max_speed_mps           DOUBLE PRECISION,
  has_heartrate           BOOLEAN DEFAULT false,
  average_heartrate       DOUBLE PRECISION,
  max_heartrate           DOUBLE PRECISION,
  calories                DOUBLE PRECISION,
  summary_polyline        TEXT,
  achievement_count       INT DEFAULT 0,
  pr_count                INT DEFAULT 0,
  synced_at               TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE strava_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own strava activities"
  ON strava_activities
  FOR ALL
  USING (auth.uid()::text = user_id);

CREATE INDEX idx_strava_activities_user_date
  ON strava_activities (user_id, start_date DESC);

CREATE INDEX idx_strava_activities_strava_id
  ON strava_activities (strava_id);
