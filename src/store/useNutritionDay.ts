import { create } from 'zustand';
import type { IntakeEvent, DailySummary, DailyNutritionTarget } from '@/lib/nutrition/types';
import { fetchIntakeEvents, fetchDailyTargets, computeDailySummary } from '@/lib/nutrition/queries';
import { createClient } from '@/lib/supabase/client';

interface NutritionDayState {
  date: string;
  events: IntakeEvent[];
  summary: DailySummary | null;
  targets: DailyNutritionTarget | null;
  loading: boolean;

  setDate: (date: string) => void;
  fetchDay: (date?: string) => Promise<void>;
  refresh: () => Promise<void>;
}

function todayString() {
  return new Date().toISOString().split('T')[0];
}

export const useNutritionDay = create<NutritionDayState>((set, get) => ({
  date: todayString(),
  events: [],
  summary: null,
  targets: null,
  loading: false,

  setDate: (date: string) => {
    set({ date });
    get().fetchDay(date);
  },

  fetchDay: async (date?: string) => {
    const d = date ?? get().date;
    set({ loading: true });
    try {
      const supabase = createClient();
      const [events, targets, summary] = await Promise.all([
        fetchIntakeEvents(supabase, d),
        fetchDailyTargets(supabase, d),
        computeDailySummary(supabase, d),
      ]);
      set({ events, targets, summary, loading: false });
    } catch (err) {
      console.error('fetchDay error:', err);
      set({ loading: false });
    }
  },

  refresh: async () => {
    await get().fetchDay();
  },
}));
