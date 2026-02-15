import { create } from 'zustand';
import type { ScheduledWorkout, WorkoutTemplate } from '@/lib/fitness/types';
import { fetchSchedule, fetchTodaySchedule, fetchTemplates } from '@/lib/fitness/queries';
import { createClient } from '@/lib/supabase/client';

interface FitnessScheduleState {
  todayWorkout: ScheduledWorkout | null;
  weekSchedule: ScheduledWorkout[];
  monthSchedule: ScheduledWorkout[];
  templates: WorkoutTemplate[];
  loading: boolean;

  fetchToday: () => Promise<void>;
  fetchWeek: (from: string, to: string) => Promise<void>;
  fetchMonth: (year: number, month: number) => Promise<void>;
  fetchTemplates: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const useFitnessSchedule = create<FitnessScheduleState>((set, get) => ({
  todayWorkout: null,
  weekSchedule: [],
  monthSchedule: [],
  templates: [],
  loading: false,

  fetchToday: async () => {
    try {
      const supabase = createClient();
      const workout = await fetchTodaySchedule(supabase);
      set({ todayWorkout: workout });
    } catch (err) {
      console.error('fetchToday error:', err);
    }
  },

  fetchWeek: async (from: string, to: string) => {
    set({ loading: true });
    try {
      const supabase = createClient();
      const schedule = await fetchSchedule(supabase, from, to);
      set({ weekSchedule: schedule, loading: false });
    } catch (err) {
      console.error('fetchWeek error:', err);
      set({ loading: false });
    }
  },

  fetchMonth: async (year: number, month: number) => {
    set({ loading: true });
    try {
      const supabase = createClient();
      const from = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month + 1, 0).getDate();
      const to = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      const schedule = await fetchSchedule(supabase, from, to);
      set({ monthSchedule: schedule, loading: false });
    } catch (err) {
      console.error('fetchMonth error:', err);
      set({ loading: false });
    }
  },

  fetchTemplates: async () => {
    try {
      const supabase = createClient();
      const templates = await fetchTemplates(supabase);
      set({ templates });
    } catch (err) {
      console.error('fetchTemplates error:', err);
    }
  },

  refresh: async () => {
    const today = new Date();
    const from = new Date(today);
    from.setDate(today.getDate() - today.getDay() + 1); // Monday
    const to = new Date(from);
    to.setDate(from.getDate() + 6); // Sunday

    await Promise.all([
      get().fetchToday(),
      get().fetchWeek(from.toISOString().split('T')[0], to.toISOString().split('T')[0]),
      get().fetchTemplates(),
    ]);
  },
}));
