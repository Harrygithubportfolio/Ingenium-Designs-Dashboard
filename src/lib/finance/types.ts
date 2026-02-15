export interface FinanceCategory {
  id: string;
  user_id: string;
  name: string;
  colour: string;
  icon: string | null;
  is_income: boolean;
  budget_monthly: number | null;
  sort_order: number;
  is_archived: boolean;
  created_at: string;
}

export interface FinanceTransaction {
  id: string;
  user_id: string;
  category_id: string | null;
  amount: number;
  is_income: boolean;
  description: string;
  transaction_date: string;
  notes: string | null;
  is_recurring: boolean;
  created_at: string;
  updated_at: string;
  category?: FinanceCategory;
}

export interface TransactionInput {
  category_id?: string | null;
  amount: number;
  is_income?: boolean;
  description: string;
  transaction_date?: string;
  notes?: string | null;
  is_recurring?: boolean;
}

export interface MonthlySummary {
  total_income: number;
  total_expenses: number;
  net: number;
  by_category: { category_name: string; colour: string; total: number }[];
}

export const DEFAULT_CATEGORIES = [
  { name: 'Housing', colour: '#3b82f6', icon: '🏠', is_income: false },
  { name: 'Transport', colour: '#f59e0b', icon: '🚗', is_income: false },
  { name: 'Food & Drink', colour: '#10b981', icon: '🍔', is_income: false },
  { name: 'Entertainment', colour: '#8b5cf6', icon: '🎬', is_income: false },
  { name: 'Shopping', colour: '#ec4899', icon: '🛍️', is_income: false },
  { name: 'Health', colour: '#ef4444', icon: '💊', is_income: false },
  { name: 'Subscriptions', colour: '#06b6d4', icon: '📱', is_income: false },
  { name: 'Education', colour: '#f97316', icon: '📚', is_income: false },
  { name: 'Gifts', colour: '#d946ef', icon: '🎁', is_income: false },
  { name: 'Travel', colour: '#14b8a6', icon: '✈️', is_income: false },
  { name: 'Savings', colour: '#22c55e', icon: '🏦', is_income: false },
  { name: 'Salary', colour: '#10b981', icon: '💰', is_income: true },
  { name: 'Freelance', colour: '#3b82f6', icon: '💻', is_income: true },
  { name: 'Other', colour: '#6b7280', icon: '📌', is_income: false },
];
