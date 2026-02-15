-- ============================================
-- MIGRATION 008: Habit Tracker & Streaks
-- Run this in the Supabase SQL Editor (data project)
-- Safe to re-run — all statements use IF NOT EXISTS
-- ============================================

CREATE TABLE IF NOT EXISTS habits (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT NOT NULL,
  name            TEXT NOT NULL,
  description     TEXT,
  colour          TEXT NOT NULL DEFAULT '#3b82f6',
  icon            TEXT,
  frequency       TEXT NOT NULL DEFAULT 'daily',
  custom_days     SMALLINT[],
  auto_source     TEXT,
  is_archived     BOOLEAN NOT NULL DEFAULT false,
  sort_order      SMALLINT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT habits_name_user_unique UNIQUE (user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_habits_user ON habits(user_id);

CREATE TABLE IF NOT EXISTS habit_completions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id        UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  completion_date DATE NOT NULL,
  completed_by    TEXT NOT NULL DEFAULT 'manual',
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT habit_completions_unique UNIQUE (habit_id, completion_date)
);

CREATE INDEX IF NOT EXISTS idx_habit_completions_habit_date ON habit_completions(habit_id, completion_date DESC);

-- RLS
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'habits' AND policyname = 'Users manage own habits'
  ) THEN
    CREATE POLICY "Users manage own habits" ON habits
      FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'habit_completions' AND policyname = 'Users manage own habit completions'
  ) THEN
    CREATE POLICY "Users manage own habit completions" ON habit_completions
      FOR ALL USING (EXISTS (
        SELECT 1 FROM habits WHERE habits.id = habit_completions.habit_id
          AND auth.uid()::text = habits.user_id
      ))
      WITH CHECK (EXISTS (
        SELECT 1 FROM habits WHERE habits.id = habit_completions.habit_id
          AND auth.uid()::text = habits.user_id
      ));
  END IF;
END $$;
