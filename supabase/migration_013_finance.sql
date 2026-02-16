-- ============================================
-- MIGRATION 013: Finance Tracker
-- Run this in the Supabase SQL Editor (tvbemlwkphnvmsromqha)
-- Safe to re-run — all statements use IF NOT EXISTS
-- ============================================

CREATE TABLE IF NOT EXISTS finance_categories (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT NOT NULL,
  name            TEXT NOT NULL,
  colour          TEXT NOT NULL DEFAULT '#3b82f6',
  icon            TEXT,
  is_income       BOOLEAN NOT NULL DEFAULT false,
  budget_monthly  NUMERIC(10,2),
  sort_order      SMALLINT NOT NULL DEFAULT 0,
  is_archived     BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT finance_categories_name_user_unique UNIQUE (user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_finance_categories_user ON finance_categories(user_id);

CREATE TABLE IF NOT EXISTS finance_transactions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           TEXT NOT NULL,
  category_id       UUID REFERENCES finance_categories(id) ON DELETE SET NULL,
  amount            NUMERIC(10,2) NOT NULL,
  is_income         BOOLEAN NOT NULL DEFAULT false,
  description       TEXT NOT NULL,
  transaction_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  notes             TEXT,
  is_recurring      BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_finance_transactions_user ON finance_transactions(user_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_category ON finance_transactions(category_id);

-- RLS
ALTER TABLE finance_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_transactions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'finance_categories' AND policyname = 'Users manage own finance categories'
  ) THEN
    CREATE POLICY "Users manage own finance categories" ON finance_categories
      FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'finance_transactions' AND policyname = 'Users manage own transactions'
  ) THEN
    CREATE POLICY "Users manage own transactions" ON finance_transactions
      FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);
  END IF;
END $$;

-- Seed default categories (only if table is empty for a given user)
-- Users will need to run this manually or it can be done via the app on first visit
