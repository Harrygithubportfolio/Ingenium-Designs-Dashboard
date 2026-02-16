-- migration_014_goals_enhanced.sql
-- Adds category, priority, target_date, progress, milestones, and sort_order
-- to the existing goals table for the enhanced Goals Summary page.

ALTER TABLE goals ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'personal';
ALTER TABLE goals ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'medium';
ALTER TABLE goals ADD COLUMN IF NOT EXISTS target_date DATE;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS progress SMALLINT NOT NULL DEFAULT 0;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS milestones JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS sort_order SMALLINT NOT NULL DEFAULT 0;

-- Constrain progress to 0–100
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'goals_progress_range'
  ) THEN
    ALTER TABLE goals ADD CONSTRAINT goals_progress_range CHECK (progress >= 0 AND progress <= 100);
  END IF;
END$$;

-- Index for common filtered queries
CREATE INDEX IF NOT EXISTS idx_goals_user_status ON goals (user_id, status);
