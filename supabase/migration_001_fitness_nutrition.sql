-- ============================================
-- FITNESS & NUTRITION SYSTEM — DATABASE MIGRATION
-- Run this in the Supabase SQL Editor (data project)
-- Safe to re-run — all statements use IF NOT EXISTS
-- ============================================

-- ==================
-- ENUMS
-- ==================

DO $$ BEGIN CREATE TYPE training_intent AS ENUM ('strength', 'hypertrophy', 'recovery', 'conditioning'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE scheduled_workout_status AS ENUM ('scheduled', 'completed', 'missed', 'rescheduled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE gym_mode_status AS ENUM ('active', 'paused', 'completed', 'abandoned'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE session_rating AS ENUM ('strong', 'normal', 'off'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE intake_method AS ENUM ('photo', 'manual'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE meal_type AS ENUM ('breakfast', 'morning_snack', 'lunch', 'afternoon_snack', 'dinner', 'evening_snack', 'other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE hunger_level AS ENUM ('not_hungry', 'slightly_hungry', 'hungry', 'very_hungry', 'starving'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE day_type AS ENUM ('training', 'rest', 'active_recovery'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE insight_domain AS ENUM ('fitness', 'nutrition', 'cross_domain'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE insight_type AS ENUM ('trend', 'pattern', 'suggestion', 'correlation', 'alert'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ==================
-- FITNESS TABLES
-- ==================

-- 1. Workout Templates (Planning Layer)
CREATE TABLE IF NOT EXISTS workout_templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT NOT NULL,
  name            TEXT NOT NULL,
  training_intent training_intent NOT NULL,
  description     TEXT,
  is_archived     BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT workout_templates_name_user_unique UNIQUE (user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_workout_templates_user ON workout_templates(user_id);

-- 2. Template Exercises (Planning Layer)
CREATE TABLE IF NOT EXISTS template_exercises (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id     UUID NOT NULL REFERENCES workout_templates(id) ON DELETE CASCADE,
  exercise_name   TEXT NOT NULL,
  sort_order      SMALLINT NOT NULL DEFAULT 0,
  target_sets     SMALLINT NOT NULL,
  target_reps     SMALLINT NOT NULL,
  target_load_kg  NUMERIC(6,2),
  target_rpe      NUMERIC(3,1),
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT template_exercises_rpe_range CHECK (target_rpe IS NULL OR (target_rpe >= 1.0 AND target_rpe <= 10.0))
);

CREATE INDEX IF NOT EXISTS idx_template_exercises_template ON template_exercises(template_id, sort_order);

-- 3. Scheduled Workouts (Commitment Layer)
CREATE TABLE IF NOT EXISTS scheduled_workouts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             TEXT NOT NULL,
  template_id         UUID NOT NULL REFERENCES workout_templates(id) ON DELETE RESTRICT,
  scheduled_date      DATE NOT NULL,
  status              scheduled_workout_status NOT NULL DEFAULT 'scheduled',
  rescheduled_to      DATE,
  rescheduled_from_id UUID REFERENCES scheduled_workouts(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT scheduled_workouts_reschedule_check CHECK (
    (status = 'rescheduled' AND rescheduled_to IS NOT NULL) OR (status != 'rescheduled')
  )
);

CREATE INDEX IF NOT EXISTS idx_scheduled_workouts_user_date ON scheduled_workouts(user_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_scheduled_workouts_status ON scheduled_workouts(status);

-- 4. Gym Sessions (Execution Layer)
CREATE TABLE IF NOT EXISTS gym_sessions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               TEXT NOT NULL,
  scheduled_workout_id  UUID REFERENCES scheduled_workouts(id) ON DELETE SET NULL,
  template_id           UUID REFERENCES workout_templates(id) ON DELETE SET NULL,
  status                gym_mode_status NOT NULL DEFAULT 'active',
  started_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at              TIMESTAMPTZ,
  total_duration_sec    INTEGER,
  total_volume_kg       NUMERIC(10,2),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT gym_sessions_end_check CHECK (
    (status IN ('completed', 'abandoned') AND ended_at IS NOT NULL) OR (status IN ('active', 'paused'))
  )
);

CREATE INDEX IF NOT EXISTS idx_gym_sessions_user ON gym_sessions(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_gym_sessions_scheduled ON gym_sessions(scheduled_workout_id);

-- 5. Execution Exercises
CREATE TABLE IF NOT EXISTS execution_exercises (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_session_id        UUID NOT NULL REFERENCES gym_sessions(id) ON DELETE CASCADE,
  template_exercise_id  UUID REFERENCES template_exercises(id) ON DELETE SET NULL,
  exercise_name         TEXT NOT NULL,
  sort_order            SMALLINT NOT NULL DEFAULT 0,
  was_skipped           BOOLEAN NOT NULL DEFAULT false,
  is_additional         BOOLEAN NOT NULL DEFAULT false,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_execution_exercises_session ON execution_exercises(gym_session_id, sort_order);

-- 6. Execution Sets
CREATE TABLE IF NOT EXISTS execution_sets (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_exercise_id   UUID NOT NULL REFERENCES execution_exercises(id) ON DELETE CASCADE,
  set_number              SMALLINT NOT NULL,
  actual_weight_kg        NUMERIC(6,2) NOT NULL,
  actual_reps             SMALLINT NOT NULL,
  notes                   TEXT,
  logged_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT execution_sets_positive CHECK (actual_weight_kg >= 0 AND actual_reps > 0)
);

CREATE INDEX IF NOT EXISTS idx_execution_sets_exercise ON execution_sets(execution_exercise_id, set_number);

-- 7. Workout Reflections
CREATE TABLE IF NOT EXISTS workout_reflections (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           TEXT NOT NULL,
  gym_session_id    UUID NOT NULL UNIQUE REFERENCES gym_sessions(id) ON DELETE CASCADE,
  session_rating    session_rating,
  reflection_note   TEXT,
  planned_volume_kg NUMERIC(10,2),
  executed_volume_kg NUMERIC(10,2),
  volume_delta_pct  NUMERIC(5,2),
  personal_records  JSONB DEFAULT '[]',
  missed_targets    JSONB DEFAULT '[]',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workout_reflections_user ON workout_reflections(user_id, created_at DESC);

-- ==================
-- NUTRITION TABLES
-- ==================

-- 8. Intake Events
CREATE TABLE IF NOT EXISTS intake_events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           TEXT NOT NULL,
  intake_method     intake_method NOT NULL,
  meal_type         meal_type NOT NULL DEFAULT 'other',
  event_timestamp   TIMESTAMPTZ NOT NULL DEFAULT now(),
  photo_url         TEXT,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_intake_events_user_date ON intake_events(user_id, event_timestamp DESC);

-- 9. Intake Items
CREATE TABLE IF NOT EXISTS intake_items (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intake_event_id       UUID NOT NULL REFERENCES intake_events(id) ON DELETE CASCADE,
  food_name             TEXT NOT NULL,
  portion_description   TEXT,
  portion_grams         NUMERIC(7,2),
  -- Original AI/system estimates (NEVER modified after creation)
  estimated_calories    NUMERIC(7,2),
  estimated_protein_g   NUMERIC(6,2),
  estimated_carbs_g     NUMERIC(6,2),
  estimated_fat_g       NUMERIC(6,2),
  confidence_score      NUMERIC(3,2),
  -- User-edited values (null if unedited)
  edited_calories       NUMERIC(7,2),
  edited_protein_g      NUMERIC(6,2),
  edited_carbs_g        NUMERIC(6,2),
  edited_fat_g          NUMERIC(6,2),
  edited_portion_grams  NUMERIC(7,2),
  was_edited            BOOLEAN NOT NULL DEFAULT false,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT intake_items_confidence_range CHECK (
    confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1)
  )
);

CREATE INDEX IF NOT EXISTS idx_intake_items_event ON intake_items(intake_event_id);

-- 10. Effective Intake Items View
CREATE OR REPLACE VIEW intake_items_effective AS
SELECT
  id,
  intake_event_id,
  food_name,
  COALESCE(edited_calories,    estimated_calories)    AS calories,
  COALESCE(edited_protein_g,   estimated_protein_g)   AS protein_g,
  COALESCE(edited_carbs_g,     estimated_carbs_g)     AS carbs_g,
  COALESCE(edited_fat_g,       estimated_fat_g)       AS fat_g,
  COALESCE(edited_portion_grams, portion_grams)       AS portion_grams,
  was_edited,
  confidence_score,
  estimated_calories    AS original_calories,
  estimated_protein_g   AS original_protein_g,
  estimated_carbs_g     AS original_carbs_g,
  estimated_fat_g       AS original_fat_g
FROM intake_items;

-- 11. Daily Nutrition Targets
CREATE TABLE IF NOT EXISTS daily_nutrition_targets (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           TEXT NOT NULL,
  target_date       DATE NOT NULL,
  day_type          day_type NOT NULL DEFAULT 'rest',
  target_calories   NUMERIC(7,2) NOT NULL,
  target_protein_g  NUMERIC(6,2) NOT NULL,
  target_carbs_g    NUMERIC(6,2) NOT NULL,
  target_fat_g      NUMERIC(6,2) NOT NULL,
  source            TEXT NOT NULL DEFAULT 'manual',
  ai_reasoning      TEXT,
  is_accepted       BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT daily_nutrition_targets_unique UNIQUE (user_id, target_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_nutrition_targets_user_date ON daily_nutrition_targets(user_id, target_date);

-- 12. Nutrition Reflections
CREATE TABLE IF NOT EXISTS nutrition_reflections (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             TEXT NOT NULL,
  reflection_date     DATE NOT NULL,
  total_calories      NUMERIC(7,2),
  total_protein_g     NUMERIC(6,2),
  total_carbs_g       NUMERIC(6,2),
  total_fat_g         NUMERIC(6,2),
  adherence_score     NUMERIC(5,2),
  largest_deviation   TEXT,
  macro_distribution  JSONB,
  ai_summary          TEXT,
  reflection_note     TEXT,
  hunger_level        hunger_level,
  social_eating_flag  BOOLEAN DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT nutrition_reflections_unique UNIQUE (user_id, reflection_date)
);

CREATE INDEX IF NOT EXISTS idx_nutrition_reflections_user ON nutrition_reflections(user_id, reflection_date DESC);

-- ==================
-- AI INSIGHTS TABLE
-- ==================

CREATE TABLE IF NOT EXISTS ai_insights (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT NOT NULL,
  domain          insight_domain NOT NULL,
  insight_type    insight_type NOT NULL,
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,
  data_references JSONB,
  is_dismissed    BOOLEAN NOT NULL DEFAULT false,
  is_actioned     BOOLEAN NOT NULL DEFAULT false,
  generated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ai_insights_body_not_empty CHECK (length(body) > 0)
);

CREATE INDEX IF NOT EXISTS idx_ai_insights_user ON ai_insights(user_id, generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_insights_domain ON ai_insights(domain);

-- ==================
-- ROW LEVEL SECURITY
-- ==================

ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE execution_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE execution_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE intake_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE intake_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_nutrition_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;

-- Policies (DROP IF EXISTS + CREATE to be idempotent)
-- Tables with user_id column: auth.uid()::text = user_id

DROP POLICY IF EXISTS "Users manage own templates" ON workout_templates;
CREATE POLICY "Users manage own templates" ON workout_templates
  FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users manage own schedule" ON scheduled_workouts;
CREATE POLICY "Users manage own schedule" ON scheduled_workouts
  FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users manage own sessions" ON gym_sessions;
CREATE POLICY "Users manage own sessions" ON gym_sessions
  FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users manage own reflections" ON workout_reflections;
CREATE POLICY "Users manage own reflections" ON workout_reflections
  FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users manage own intake" ON intake_events;
CREATE POLICY "Users manage own intake" ON intake_events
  FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users manage own targets" ON daily_nutrition_targets;
CREATE POLICY "Users manage own targets" ON daily_nutrition_targets
  FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users manage own nutrition reflections" ON nutrition_reflections;
CREATE POLICY "Users manage own nutrition reflections" ON nutrition_reflections
  FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users manage own insights" ON ai_insights;
CREATE POLICY "Users manage own insights" ON ai_insights
  FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

-- Child tables: use parent FK to verify ownership

DROP POLICY IF EXISTS "Users manage own template exercises" ON template_exercises;
CREATE POLICY "Users manage own template exercises" ON template_exercises
  FOR ALL USING (EXISTS (
    SELECT 1 FROM workout_templates WHERE workout_templates.id = template_exercises.template_id
      AND auth.uid()::text = workout_templates.user_id
  ));

DROP POLICY IF EXISTS "Users manage own execution exercises" ON execution_exercises;
CREATE POLICY "Users manage own execution exercises" ON execution_exercises
  FOR ALL USING (EXISTS (
    SELECT 1 FROM gym_sessions WHERE gym_sessions.id = execution_exercises.gym_session_id
      AND auth.uid()::text = gym_sessions.user_id
  ));

DROP POLICY IF EXISTS "Users manage own sets" ON execution_sets;
CREATE POLICY "Users manage own sets" ON execution_sets
  FOR ALL USING (EXISTS (
    SELECT 1 FROM execution_exercises
      JOIN gym_sessions ON gym_sessions.id = execution_exercises.gym_session_id
    WHERE execution_exercises.id = execution_sets.execution_exercise_id
      AND auth.uid()::text = gym_sessions.user_id
  ));

DROP POLICY IF EXISTS "Users manage own intake items" ON intake_items;
CREATE POLICY "Users manage own intake items" ON intake_items
  FOR ALL USING (EXISTS (
    SELECT 1 FROM intake_events WHERE intake_events.id = intake_items.intake_event_id
      AND auth.uid()::text = intake_events.user_id
  ));
