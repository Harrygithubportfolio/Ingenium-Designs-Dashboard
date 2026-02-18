import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import {
  DailyFocus,
  Reflection,
  DailyFocusRow,
  ReflectionRow,
  FocusTask,
  toClientFocus,
  toClientReflection,
} from '@/lib/focus/types';
import { migrateLocalStorage } from '@/lib/focus/migrate-local';

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

interface DailyFocusState {
  focus: DailyFocus | null;
  reflection: Reflection | null;
  loading: boolean;
  migrated: boolean;

  fetchToday: () => Promise<void>;
  saveFocus: (input: {
    primaryFocus: string;
    supportingTasks: FocusTask[];
    intentionNote?: string;
  }) => Promise<void>;
  updateFocus: (updates: Partial<{
    primaryFocus: string;
    primaryFocusCompleted: boolean;
    supportingTasks: FocusTask[];
    intentionNote: string;
  }>) => Promise<void>;
  togglePrimaryFocus: () => Promise<void>;
  toggleTask: (taskId: string) => Promise<void>;
  saveReflection: (input: {
    wentWell: string;
    challenges: string;
    improvements: string;
    gratitude?: string;
  }) => Promise<void>;
  updateReflection: (updates: Partial<{
    wentWell: string;
    challenges: string;
    improvements: string;
    gratitude: string;
  }>) => Promise<void>;
}

export const useDailyFocus = create<DailyFocusState>((set, get) => ({
  focus: null,
  reflection: null,
  loading: true,
  migrated: false,

  fetchToday: async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      set({ loading: false });
      return;
    }

    // One-time localStorage migration
    if (!get().migrated) {
      await migrateLocalStorage(supabase, user.id);
      set({ migrated: true });
    }

    const today = getTodayString();

    const [focusRes, reflectionRes] = await Promise.all([
      supabase
        .from('daily_focus')
        .select('*')
        .eq('focus_date', today)
        .maybeSingle(),
      supabase
        .from('reflections')
        .select('*')
        .eq('reflect_date', today)
        .maybeSingle(),
    ]);

    set({
      focus: focusRes.data ? toClientFocus(focusRes.data as DailyFocusRow) : null,
      reflection: reflectionRes.data ? toClientReflection(reflectionRes.data as ReflectionRow) : null,
      loading: false,
    });
  },

  saveFocus: async (input) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = getTodayString();
    const existing = get().focus;

    const row = {
      user_id: user.id,
      focus_date: today,
      primary_focus: input.primaryFocus,
      primary_focus_completed: existing?.primaryFocusCompleted ?? false,
      supporting_tasks: input.supportingTasks,
      intention_note: input.intentionNote || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('daily_focus')
      .upsert(row, { onConflict: 'user_id,focus_date' })
      .select()
      .single();

    if (error) {
      console.error('saveFocus error:', error);
      return;
    }

    set({ focus: toClientFocus(data as DailyFocusRow) });
  },

  updateFocus: async (updates) => {
    const state = get();
    if (!state.focus) return;

    const supabase = createClient();

    const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.primaryFocus !== undefined) row.primary_focus = updates.primaryFocus;
    if (updates.primaryFocusCompleted !== undefined) row.primary_focus_completed = updates.primaryFocusCompleted;
    if (updates.supportingTasks !== undefined) row.supporting_tasks = updates.supportingTasks;
    if (updates.intentionNote !== undefined) row.intention_note = updates.intentionNote || null;

    const { data, error } = await supabase
      .from('daily_focus')
      .update(row)
      .eq('id', state.focus.id)
      .select()
      .single();

    if (error) {
      console.error('updateFocus error:', error);
      return;
    }

    set({ focus: toClientFocus(data as DailyFocusRow) });
  },

  togglePrimaryFocus: async () => {
    const state = get();
    if (!state.focus) return;

    const newValue = !state.focus.primaryFocusCompleted;

    // Optimistic update
    set({
      focus: { ...state.focus, primaryFocusCompleted: newValue },
    });

    const supabase = createClient();
    const { error } = await supabase
      .from('daily_focus')
      .update({
        primary_focus_completed: newValue,
        updated_at: new Date().toISOString(),
      })
      .eq('id', state.focus.id);

    if (error) {
      console.error('togglePrimaryFocus error:', error);
      // Revert on error
      set({ focus: { ...state.focus, primaryFocusCompleted: !newValue } });
    }
  },

  toggleTask: async (taskId) => {
    const state = get();
    if (!state.focus) return;

    const updatedTasks = state.focus.supportingTasks.map(t =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );

    // Optimistic update
    set({
      focus: { ...state.focus, supportingTasks: updatedTasks },
    });

    const supabase = createClient();
    const { error } = await supabase
      .from('daily_focus')
      .update({
        supporting_tasks: updatedTasks,
        updated_at: new Date().toISOString(),
      })
      .eq('id', state.focus.id);

    if (error) {
      console.error('toggleTask error:', error);
      // Revert on error
      set({ focus: state.focus });
    }
  },

  saveReflection: async (input) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = getTodayString();

    const row = {
      user_id: user.id,
      reflect_date: today,
      went_well: input.wentWell,
      challenges: input.challenges,
      improvements: input.improvements,
      gratitude: input.gratitude || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('reflections')
      .upsert(row, { onConflict: 'user_id,reflect_date' })
      .select()
      .single();

    if (error) {
      console.error('saveReflection error:', error);
      return;
    }

    set({ reflection: toClientReflection(data as ReflectionRow) });
  },

  updateReflection: async (updates) => {
    const state = get();
    if (!state.reflection) return;

    const supabase = createClient();

    const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.wentWell !== undefined) row.went_well = updates.wentWell;
    if (updates.challenges !== undefined) row.challenges = updates.challenges;
    if (updates.improvements !== undefined) row.improvements = updates.improvements;
    if (updates.gratitude !== undefined) row.gratitude = updates.gratitude || null;

    const { data, error } = await supabase
      .from('reflections')
      .update(row)
      .eq('id', state.reflection.id)
      .select()
      .single();

    if (error) {
      console.error('updateReflection error:', error);
      return;
    }

    set({ reflection: toClientReflection(data as ReflectionRow) });
  },
}));
