-- ============================================
-- FITNESS PROGRAMMES & GAMIFICATION — DATABASE MIGRATION
-- Run this in the Supabase SQL Editor (tvbemlwkphnvmsromqha)
-- Safe to re-run — all statements use IF NOT EXISTS
-- ============================================

-- ==================
-- ENUMS
-- ==================

DO $$ BEGIN CREATE TYPE programme_status AS ENUM ('draft', 'active', 'completed', 'abandoned'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE programme_goal AS ENUM ('lose_weight', 'build_muscle', 'improve_strength', 'general_fitness', 'sport_specific'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE experience_level AS ENUM ('beginner', 'intermediate', 'advanced'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE equipment_access AS ENUM ('full_gym', 'home_gym', 'bodyweight_only'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE pr_record_type AS ENUM ('weight', 'reps', 'volume'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ==================
-- TRAINING PROGRAMMES
-- ==================

CREATE TABLE IF NOT EXISTS training_programmes (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 TEXT NOT NULL,
  name                    TEXT NOT NULL,
  goal                    programme_goal NOT NULL,
  duration_weeks          SMALLINT NOT NULL,
  days_per_week           SMALLINT NOT NULL,
  experience_level        experience_level NOT NULL,
  equipment_access        equipment_access NOT NULL,
  session_duration_min    SMALLINT NOT NULL DEFAULT 60,
  questionnaire_responses JSONB NOT NULL DEFAULT '{}',
  ai_generated_plan       JSONB NOT NULL DEFAULT '{}',
  description             TEXT,
  status                  programme_status NOT NULL DEFAULT 'draft',
  activated_at            TIMESTAMPTZ,
  completed_at            TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT training_programmes_weeks_check CHECK (duration_weeks >= 1 AND duration_weeks <= 52),
  CONSTRAINT training_programmes_days_check CHECK (days_per_week >= 1 AND days_per_week <= 7)
);

CREATE INDEX IF NOT EXISTS idx_training_programmes_user ON training_programmes(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_training_programmes_status ON training_programmes(user_id, status);

-- Programme workouts — each workout day in the programme
CREATE TABLE IF NOT EXISTS programme_workouts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  programme_id    UUID NOT NULL REFERENCES training_programmes(id) ON DELETE CASCADE,
  week_number     SMALLINT NOT NULL,
  day_number      SMALLINT NOT NULL,
  workout_name    TEXT NOT NULL,
  training_intent training_intent NOT NULL DEFAULT 'hypertrophy',
  exercises       JSONB NOT NULL DEFAULT '[]',
  notes           TEXT,
  sort_order      SMALLINT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT programme_workouts_week_check CHECK (week_number >= 1),
  CONSTRAINT programme_workouts_day_check CHECK (day_number >= 1 AND day_number <= 7)
);

CREATE INDEX IF NOT EXISTS idx_programme_workouts_programme ON programme_workouts(programme_id, week_number, day_number);

-- Add optional programme_id FK to scheduled_workouts
ALTER TABLE scheduled_workouts ADD COLUMN IF NOT EXISTS programme_id UUID REFERENCES training_programmes(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_scheduled_workouts_programme ON scheduled_workouts(programme_id);

-- ==================
-- PERSONAL RECORDS
-- ==================

CREATE TABLE IF NOT EXISTS personal_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT NOT NULL,
  exercise_name   TEXT NOT NULL,
  record_type     pr_record_type NOT NULL,
  value           NUMERIC(8,2) NOT NULL,
  previous_value  NUMERIC(8,2),
  gym_session_id  UUID REFERENCES gym_sessions(id) ON DELETE SET NULL,
  achieved_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT personal_records_positive CHECK (value > 0)
);

CREATE INDEX IF NOT EXISTS idx_personal_records_user ON personal_records(user_id, exercise_name, record_type);
CREATE INDEX IF NOT EXISTS idx_personal_records_exercise ON personal_records(exercise_name, user_id, achieved_at DESC);

-- ==================
-- GAMIFICATION: XP & ACHIEVEMENTS
-- ==================

CREATE TABLE IF NOT EXISTS fitness_xp_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT NOT NULL,
  xp_amount       INTEGER NOT NULL,
  source_type     TEXT NOT NULL,
  source_id       UUID,
  description     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fitness_xp_log_positive CHECK (xp_amount > 0)
);

CREATE INDEX IF NOT EXISTS idx_fitness_xp_log_user ON fitness_xp_log(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS fitness_achievements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT NOT NULL,
  achievement_key TEXT NOT NULL,
  unlocked_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata        JSONB DEFAULT '{}',
  CONSTRAINT fitness_achievements_unique UNIQUE (user_id, achievement_key)
);

CREATE INDEX IF NOT EXISTS idx_fitness_achievements_user ON fitness_achievements(user_id);

-- ==================
-- USER FITNESS PROFILE
-- ==================

CREATE TABLE IF NOT EXISTS fitness_profiles (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             TEXT NOT NULL UNIQUE,
  total_xp            INTEGER NOT NULL DEFAULT 0,
  current_level       SMALLINT NOT NULL DEFAULT 1,
  current_streak      SMALLINT NOT NULL DEFAULT 0,
  longest_streak      SMALLINT NOT NULL DEFAULT 0,
  last_workout_date   DATE,
  total_workouts      INTEGER NOT NULL DEFAULT 0,
  total_volume_kg     NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fitness_profiles_xp_positive CHECK (total_xp >= 0),
  CONSTRAINT fitness_profiles_level_positive CHECK (current_level >= 1)
);

CREATE INDEX IF NOT EXISTS idx_fitness_profiles_user ON fitness_profiles(user_id);

-- ==================
-- ROW LEVEL SECURITY
-- ==================

ALTER TABLE training_programmes ENABLE ROW LEVEL SECURITY;
ALTER TABLE programme_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitness_xp_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitness_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitness_profiles ENABLE ROW LEVEL SECURITY;

-- Training programmes
DROP POLICY IF EXISTS "Users manage own programmes" ON training_programmes;
CREATE POLICY "Users manage own programmes" ON training_programmes
  FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

-- Programme workouts (child table — check parent ownership)
DROP POLICY IF EXISTS "Users manage own programme workouts" ON programme_workouts;
CREATE POLICY "Users manage own programme workouts" ON programme_workouts
  FOR ALL USING (EXISTS (
    SELECT 1 FROM training_programmes
    WHERE training_programmes.id = programme_workouts.programme_id
      AND auth.uid()::text = training_programmes.user_id
  )) WITH CHECK (EXISTS (
    SELECT 1 FROM training_programmes
    WHERE training_programmes.id = programme_workouts.programme_id
      AND auth.uid()::text = training_programmes.user_id
  ));

-- Personal records
DROP POLICY IF EXISTS "Users manage own PRs" ON personal_records;
CREATE POLICY "Users manage own PRs" ON personal_records
  FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

-- XP log
DROP POLICY IF EXISTS "Users manage own XP" ON fitness_xp_log;
CREATE POLICY "Users manage own XP" ON fitness_xp_log
  FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

-- Achievements
DROP POLICY IF EXISTS "Users manage own achievements" ON fitness_achievements;
CREATE POLICY "Users manage own achievements" ON fitness_achievements
  FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

-- Fitness profiles
DROP POLICY IF EXISTS "Users manage own fitness profile" ON fitness_profiles;
CREATE POLICY "Users manage own fitness profile" ON fitness_profiles
  FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);
