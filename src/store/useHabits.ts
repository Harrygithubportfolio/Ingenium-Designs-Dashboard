import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import type { Habit, HabitCompletion, HabitInput, HabitWithStats } from '@/lib/habits/types';

interface HabitsState {
  habits: HabitWithStats[];
  completionMap: Record<string, Record<string, boolean>>; // habitId -> date -> true
  loading: boolean;

  fetchHabits: () => Promise<void>;
  addHabit: (input: HabitInput) => Promise<void>;
  updateHabit: (id: string, updates: Partial<HabitInput>) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  toggleCompletion: (habitId: string, date: string) => Promise<void>;
  fetchCompletions: (from: string, to: string) => Promise<void>;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function computeStreak(completions: HabitCompletion[]): { current: number; best: number } {
  if (completions.length === 0) return { current: 0, best: 0 };

  const dates = new Set(completions.map((c) => c.completion_date));
  const sorted = Array.from(dates).sort().reverse();

  let current = 0;
  let best = 0;
  let streak = 0;
  let prev: Date | null = null;

  // Check if today or yesterday is in the set (allow one day grace)
  const todayStr = today();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);
  const startsFromRecent = dates.has(todayStr) || dates.has(yesterdayStr);

  for (const dateStr of sorted) {
    const d = new Date(dateStr);
    if (prev === null) {
      streak = 1;
    } else {
      const diff = (prev.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        streak++;
      } else {
        if (streak > best) best = streak;
        if (current === 0 && startsFromRecent) current = streak;
        streak = 1;
      }
    }
    prev = d;
  }

  if (streak > best) best = streak;
  if (current === 0 && startsFromRecent) current = streak;

  return { current, best };
}

export const useHabits = create<HabitsState>((set, get) => ({
  habits: [],
  completionMap: {},
  loading: false,

  fetchHabits: async () => {
    set({ loading: true });
    const supabase = createClient();

    // Fetch habits
    const { data: habits, error } = await supabase
      .from('habits')
      .select('*')
      .eq('is_archived', false)
      .order('sort_order', { ascending: true });

    if (error || !habits) {
      console.error('fetchHabits error:', error);
      set({ loading: false });
      return;
    }

    // Fetch completions for the last 365 days
    const to = today();
    const from = new Date();
    from.setDate(from.getDate() - 365);
    const fromStr = from.toISOString().slice(0, 10);

    const habitIds = habits.map((h: Habit) => h.id);
    const { data: completions } = await supabase
      .from('habit_completions')
      .select('*')
      .in('habit_id', habitIds.length > 0 ? habitIds : ['__none__'])
      .gte('completion_date', fromStr)
      .lte('completion_date', to);

    const allCompletions = (completions ?? []) as HabitCompletion[];

    // Build completion map
    const map: Record<string, Record<string, boolean>> = {};
    for (const c of allCompletions) {
      if (!map[c.habit_id]) map[c.habit_id] = {};
      map[c.habit_id][c.completion_date] = true;
    }

    // Compute stats per habit
    const habitsWithStats: HabitWithStats[] = habits.map((h: Habit) => {
      const hCompletions = allCompletions.filter((c) => c.habit_id === h.id);
      const { current, best } = computeStreak(hCompletions);
      return {
        ...h,
        currentStreak: current,
        bestStreak: best,
        completedToday: !!map[h.id]?.[today()],
      };
    });

    set({ habits: habitsWithStats, completionMap: map, loading: false });
  },

  addHabit: async (input) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('habits').insert({
      user_id: user.id,
      name: input.name,
      description: input.description || null,
      colour: input.colour || '#3b82f6',
      icon: input.icon || null,
      frequency: input.frequency || 'daily',
      custom_days: input.custom_days || null,
      auto_source: input.auto_source || null,
    });
    if (error) {
      console.error('addHabit error:', error);
      return;
    }
    await get().fetchHabits();
  },

  updateHabit: async (id, updates) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('habits')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) {
      console.error('updateHabit error:', error);
      return;
    }
    await get().fetchHabits();
  },

  deleteHabit: async (id) => {
    const supabase = createClient();
    const { error } = await supabase.from('habits').delete().eq('id', id);
    if (error) {
      console.error('deleteHabit error:', error);
      return;
    }
    await get().fetchHabits();
  },

  toggleCompletion: async (habitId, date) => {
    const supabase = createClient();
    const map = get().completionMap;
    const isCompleted = !!map[habitId]?.[date];

    if (isCompleted) {
      // Remove completion
      const { error } = await supabase
        .from('habit_completions')
        .delete()
        .eq('habit_id', habitId)
        .eq('completion_date', date);
      if (error) {
        console.error('toggleCompletion delete error:', error);
        return;
      }
    } else {
      // Add completion
      const { error } = await supabase
        .from('habit_completions')
        .insert({ habit_id: habitId, completion_date: date, completed_by: 'manual' });
      if (error) {
        console.error('toggleCompletion insert error:', error);
        return;
      }
    }

    await get().fetchHabits();
  },

  fetchCompletions: async (from, to) => {
    const supabase = createClient();
    const habitIds = get().habits.map((h) => h.id);
    if (habitIds.length === 0) return;

    const { data } = await supabase
      .from('habit_completions')
      .select('*')
      .in('habit_id', habitIds)
      .gte('completion_date', from)
      .lte('completion_date', to);

    const allCompletions = (data ?? []) as HabitCompletion[];
    const map: Record<string, Record<string, boolean>> = {};
    for (const c of allCompletions) {
      if (!map[c.habit_id]) map[c.habit_id] = {};
      map[c.habit_id][c.completion_date] = true;
    }
    set({ completionMap: map });
  },
}));
