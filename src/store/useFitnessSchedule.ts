import { create } from 'zustand';
import type { ScheduledWorkout, WorkoutTemplate } from '@/lib/fitness/types';
import { fetchSchedule, fetchTodaySchedule, fetchTemplates } from '@/lib/fitness/queries';

interface FitnessScheduleState {
  todayWorkout: ScheduledWorkout | null;
  weekSchedule: ScheduledWorkout[];
  templates: WorkoutTemplate[];
  loading: boolean;

  fetchToday: () => Promise<void>;
  fetchWeek: (from: string, to: string) => Promise<void>;
  fetchTemplates: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const useFitnessSchedule = create<FitnessScheduleState>((set, get) => ({
  todayWorkout: null,
  weekSchedule: [],
  templates: [],
  loading: false,

  fetchToday: async () => {
    try {
      const workout = await fetchTodaySchedule();
      set({ todayWorkout: workout });
    } catch (err) {
      console.error('fetchToday error:', err);
    }
  },

  fetchWeek: async (from: string, to: string) => {
    set({ loading: true });
    try {
      const schedule = await fetchSchedule(from, to);
      set({ weekSchedule: schedule, loading: false });
    } catch (err) {
      console.error('fetchWeek error:', err);
      set({ loading: false });
    }
  },

  fetchTemplates: async () => {
    try {
      const templates = await fetchTemplates();
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
