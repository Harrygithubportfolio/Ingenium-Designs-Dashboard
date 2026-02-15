import { create } from 'zustand';
import type { GymSession, ExecutionSet, LogSetInput } from '@/lib/fitness/types';
import * as mutations from '@/lib/fitness/mutations';
import { fetchActiveGymSession, fetchGymSession } from '@/lib/fitness/queries';
import { createClient } from '@/lib/supabase/client';

interface GymSessionState {
  // State
  session: GymSession | null;
  status: 'idle' | 'active' | 'paused' | 'completed' | 'abandoned';
  currentExerciseIndex: number;
  loading: boolean;
  error: string | null;

  // Timer
  elapsedSeconds: number;
  timerRunning: boolean;

  // Actions
  checkForActiveSession: () => Promise<void>;
  startSession: (scheduledWorkoutId?: string) => Promise<void>;
  refreshSession: () => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  complete: () => Promise<GymSession | null>;
  abandon: () => Promise<void>;
  logSet: (input: LogSetInput) => Promise<ExecutionSet | null>;
  addExercise: (name: string) => Promise<void>;
  skipExercise: () => Promise<void>;
  nextExercise: () => void;
  prevExercise: () => void;
  tickTimer: () => void;
  reset: () => void;
}

export const useGymSession = create<GymSessionState>((set, get) => ({
  session: null,
  status: 'idle',
  currentExerciseIndex: 0,
  loading: false,
  error: null,
  elapsedSeconds: 0,
  timerRunning: false,

  checkForActiveSession: async () => {
    set({ loading: true });
    try {
      const supabase = createClient();
      const session = await fetchActiveGymSession(supabase);
      if (session) {
        const elapsed = Math.floor(
          (Date.now() - new Date(session.started_at).getTime()) / 1000
        );
        set({
          session,
          status: session.status as 'active' | 'paused',
          elapsedSeconds: elapsed,
          timerRunning: session.status === 'active',
        });
      }
    } catch (err) {
      console.error('checkForActiveSession error:', err);
    } finally {
      set({ loading: false });
    }
  },

  startSession: async (scheduledWorkoutId?: string) => {
    set({ loading: true, error: null });
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const session = await mutations.startGymSession(supabase, user.id, scheduledWorkoutId);
      // Re-fetch to get full session with exercises
      const fullSession = await fetchGymSession(supabase, session.id);
      set({
        session: fullSession,
        status: 'active',
        currentExerciseIndex: 0,
        elapsedSeconds: 0,
        timerRunning: true,
        loading: false,
      });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  refreshSession: async () => {
    const { session } = get();
    if (!session) return;
    try {
      const supabase = createClient();
      const fresh = await fetchGymSession(supabase, session.id);
      set({ session: fresh });
    } catch (err) {
      console.error('refreshSession error:', err);
    }
  },

  pause: async () => {
    const { session, status } = get();
    if (!session || status !== 'active') return;
    try {
      const supabase = createClient();
      await mutations.updateSessionStatus(supabase, session.id, 'paused');
      set({ status: 'paused', timerRunning: false });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  resume: async () => {
    const { session, status } = get();
    if (!session || status !== 'paused') return;
    try {
      const supabase = createClient();
      await mutations.updateSessionStatus(supabase, session.id, 'active');
      set({ status: 'active', timerRunning: true });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  complete: async () => {
    const { session, status } = get();
    if (!session || (status !== 'active' && status !== 'paused')) return null;
    try {
      const supabase = createClient();
      const completed = await mutations.updateSessionStatus(supabase, session.id, 'completed');
      set({ status: 'completed', timerRunning: false });
      return completed;
    } catch (err) {
      set({ error: (err as Error).message });
      return null;
    }
  },

  abandon: async () => {
    const { session, status } = get();
    if (!session || (status !== 'active' && status !== 'paused')) return;
    try {
      const supabase = createClient();
      await mutations.updateSessionStatus(supabase, session.id, 'abandoned');
      set({ status: 'abandoned', timerRunning: false });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  logSet: async (input: LogSetInput) => {
    const { session, status } = get();
    if (!session || status !== 'active') return null;
    try {
      const supabase = createClient();
      const newSet = await mutations.logSet(supabase, session.id, input);
      await get().refreshSession();
      return newSet;
    } catch (err) {
      set({ error: (err as Error).message });
      return null;
    }
  },

  addExercise: async (name: string) => {
    const { session, status } = get();
    if (!session || status !== 'active') return;
    try {
      const supabase = createClient();
      await mutations.addExerciseToSession(supabase, session.id, name);
      await get().refreshSession();
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  skipExercise: async () => {
    const { session, status, currentExerciseIndex } = get();
    if (!session || status !== 'active') return;
    const exercises = session.exercises ?? [];
    const current = exercises[currentExerciseIndex];
    if (!current) return;
    try {
      const supabase = createClient();
      await mutations.skipExercise(supabase, current.id);
      if (currentExerciseIndex < exercises.length - 1) {
        set({ currentExerciseIndex: currentExerciseIndex + 1 });
      }
      await get().refreshSession();
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  nextExercise: () => {
    const { session, currentExerciseIndex } = get();
    const exercises = session?.exercises ?? [];
    if (currentExerciseIndex < exercises.length - 1) {
      set({ currentExerciseIndex: currentExerciseIndex + 1 });
    }
  },

  prevExercise: () => {
    const { currentExerciseIndex } = get();
    if (currentExerciseIndex > 0) {
      set({ currentExerciseIndex: currentExerciseIndex - 1 });
    }
  },

  tickTimer: () => {
    const { timerRunning } = get();
    if (timerRunning) {
      set((s) => ({ elapsedSeconds: s.elapsedSeconds + 1 }));
    }
  },

  reset: () => {
    set({
      session: null,
      status: 'idle',
      currentExerciseIndex: 0,
      elapsedSeconds: 0,
      timerRunning: false,
      loading: false,
      error: null,
    });
  },
}));
