import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import type { SleepLog, SleepLogInput, HydrationLog, HydrationEntry } from '@/lib/health/types';

interface HealthState {
  date: string;
  sleep: SleepLog | null;
  hydration: HydrationLog | null;
  sleepHistory: SleepLog[];
  hydrationHistory: HydrationLog[];
  loading: boolean;

  setDate: (date: string) => void;
  fetchDay: (date?: string) => Promise<void>;
  fetchSleepHistory: (from: string, to: string) => Promise<void>;
  fetchHydrationHistory: (from: string, to: string) => Promise<void>;
  saveSleep: (input: SleepLogInput) => Promise<void>;
  addWater: (ml: number) => Promise<void>;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function nowTime(): string {
  return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export const useHealth = create<HealthState>((set, get) => ({
  date: today(),
  sleep: null,
  hydration: null,
  sleepHistory: [],
  hydrationHistory: [],
  loading: false,

  setDate: (date) => {
    set({ date });
    get().fetchDay(date);
  },

  fetchDay: async (date) => {
    const d = date || get().date;
    set({ loading: true });
    const supabase = createClient();

    const [sleepRes, hydrationRes] = await Promise.all([
      supabase.from('sleep_logs').select('*').eq('log_date', d).maybeSingle(),
      supabase.from('hydration_logs').select('*').eq('log_date', d).maybeSingle(),
    ]);

    set({
      sleep: sleepRes.data as SleepLog | null,
      hydration: hydrationRes.data as HydrationLog | null,
      loading: false,
    });
  },

  fetchSleepHistory: async (from, to) => {
    const supabase = createClient();
    const { data } = await supabase
      .from('sleep_logs')
      .select('*')
      .gte('log_date', from)
      .lte('log_date', to)
      .order('log_date', { ascending: true });
    set({ sleepHistory: (data ?? []) as SleepLog[] });
  },

  fetchHydrationHistory: async (from, to) => {
    const supabase = createClient();
    const { data } = await supabase
      .from('hydration_logs')
      .select('*')
      .gte('log_date', from)
      .lte('log_date', to)
      .order('log_date', { ascending: true });
    set({ hydrationHistory: (data ?? []) as HydrationLog[] });
  },

  saveSleep: async (input) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const d = get().date;
    const { error } = await supabase
      .from('sleep_logs')
      .upsert(
        { user_id: user.id, log_date: d, ...input, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,log_date' },
      );
    if (error) {
      console.error('saveSleep error:', error);
      return;
    }
    await get().fetchDay(d);
  },

  addWater: async (ml) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const d = get().date;
    const current = get().hydration;
    const entries: HydrationEntry[] = current?.entries ?? [];
    const newEntry: HydrationEntry = { time: nowTime(), ml };
    const updatedEntries = [...entries, newEntry];
    const newTotal = (current?.total_ml ?? 0) + ml;

    const { error } = await supabase
      .from('hydration_logs')
      .upsert(
        {
          user_id: user.id,
          log_date: d,
          total_ml: newTotal,
          target_ml: current?.target_ml ?? 2500,
          entries: updatedEntries,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,log_date' },
      );
    if (error) {
      console.error('addWater error:', error);
      return;
    }
    await get().fetchDay(d);
  },
}));
