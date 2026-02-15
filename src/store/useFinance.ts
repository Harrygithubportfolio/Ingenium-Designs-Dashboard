import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import type { FinanceCategory, FinanceTransaction, TransactionInput, DEFAULT_CATEGORIES } from '@/lib/finance/types';

interface FinanceState {
  categories: FinanceCategory[];
  transactions: FinanceTransaction[];
  loading: boolean;

  fetchCategories: () => Promise<void>;
  seedDefaultCategories: () => Promise<void>;
  fetchTransactions: (from?: string, to?: string) => Promise<void>;
  addTransaction: (input: TransactionInput) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
}

export const useFinance = create<FinanceState>((set, get) => ({
  categories: [],
  transactions: [],
  loading: false,

  fetchCategories: async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('finance_categories')
      .select('*')
      .eq('is_archived', false)
      .order('sort_order', { ascending: true });
    set({ categories: (data ?? []) as FinanceCategory[] });
  },

  seedDefaultCategories: async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Only seed if no categories exist
    const { count } = await supabase
      .from('finance_categories')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (count && count > 0) return;

    const { DEFAULT_CATEGORIES } = await import('@/lib/finance/types');
    const rows = DEFAULT_CATEGORIES.map((c, i) => ({
      user_id: user.id,
      name: c.name,
      colour: c.colour,
      icon: c.icon,
      is_income: c.is_income,
      sort_order: i,
    }));

    await supabase.from('finance_categories').insert(rows);
    await get().fetchCategories();
  },

  fetchTransactions: async (from, to) => {
    set({ loading: true });
    const supabase = createClient();
    let query = supabase
      .from('finance_transactions')
      .select('*, category:finance_categories(*)')
      .order('transaction_date', { ascending: false });

    if (from) query = query.gte('transaction_date', from);
    if (to) query = query.lte('transaction_date', to);

    const { data } = await query;
    set({ transactions: (data ?? []) as FinanceTransaction[], loading: false });
  },

  addTransaction: async (input) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('finance_transactions').insert({
      user_id: user.id,
      category_id: input.category_id || null,
      amount: input.amount,
      is_income: input.is_income || false,
      description: input.description,
      transaction_date: input.transaction_date || new Date().toISOString().slice(0, 10),
      notes: input.notes || null,
      is_recurring: input.is_recurring || false,
    });

    if (error) {
      console.error('addTransaction error:', error);
      return;
    }
    await get().fetchTransactions();
  },

  deleteTransaction: async (id) => {
    const supabase = createClient();
    const { error } = await supabase.from('finance_transactions').delete().eq('id', id);
    if (error) {
      console.error('deleteTransaction error:', error);
      return;
    }
    await get().fetchTransactions();
  },
}));
