import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';

export type FocusPhase = 'idle' | 'focus' | 'break';

interface FocusTimerState {
  sessionId: string | null;
  phase: FocusPhase;
  focusMinutes: number;
  breakMinutes: number;
  totalPomodoros: number;
  completedPomodoros: number;
  totalFocusSeconds: number;
  secondsRemaining: number;
  label: string;
  spotifyPlaylistUri: string | null;
  running: boolean;

  startSession: (opts: { focusMinutes: number; breakMinutes: number; totalPomodoros: number; label: string; spotifyPlaylistUri?: string | null }) => Promise<void>;
  tick: () => void;
  pause: () => void;
  resume: () => void;
  skipBreak: () => void;
  endSession: (status: 'completed' | 'abandoned') => Promise<void>;
  reset: () => void;
}

export const useFocusTimer = create<FocusTimerState>((set, get) => ({
  sessionId: null,
  phase: 'idle',
  focusMinutes: 25,
  breakMinutes: 5,
  totalPomodoros: 4,
  completedPomodoros: 0,
  totalFocusSeconds: 0,
  secondsRemaining: 0,
  label: '',
  spotifyPlaylistUri: null,
  running: false,

  startSession: async (opts) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('focus_sessions')
      .insert({
        user_id: user.id,
        focus_minutes: opts.focusMinutes,
        break_minutes: opts.breakMinutes,
        total_pomodoros: opts.totalPomodoros,
        label: opts.label || null,
        spotify_playlist_uri: opts.spotifyPlaylistUri || null,
      })
      .select()
      .single();

    if (error || !data) {
      console.error('startSession error:', error);
      return;
    }

    set({
      sessionId: data.id,
      phase: 'focus',
      focusMinutes: opts.focusMinutes,
      breakMinutes: opts.breakMinutes,
      totalPomodoros: opts.totalPomodoros,
      completedPomodoros: 0,
      totalFocusSeconds: 0,
      secondsRemaining: opts.focusMinutes * 60,
      label: opts.label,
      spotifyPlaylistUri: opts.spotifyPlaylistUri || null,
      running: true,
    });
  },

  tick: () => {
    const state = get();
    if (!state.running || state.phase === 'idle') return;

    const newRemaining = state.secondsRemaining - 1;

    if (state.phase === 'focus') {
      const newTotalFocus = state.totalFocusSeconds + 1;

      if (newRemaining <= 0) {
        // Pomodoro complete
        const newCompleted = state.completedPomodoros + 1;

        if (newCompleted >= state.totalPomodoros) {
          // Session complete
          set({
            secondsRemaining: 0,
            completedPomodoros: newCompleted,
            totalFocusSeconds: newTotalFocus,
            phase: 'idle',
            running: false,
          });
          // Save to DB
          const supabase = createClient();
          if (state.sessionId) {
            supabase.from('focus_sessions').update({
              status: 'completed',
              completed_pomodoros: newCompleted,
              total_focus_seconds: newTotalFocus,
              ended_at: new Date().toISOString(),
            }).eq('id', state.sessionId).then(() => {});
          }
          return;
        }

        // Start break
        set({
          phase: 'break',
          secondsRemaining: state.breakMinutes * 60,
          completedPomodoros: newCompleted,
          totalFocusSeconds: newTotalFocus,
        });
        return;
      }

      set({ secondsRemaining: newRemaining, totalFocusSeconds: newTotalFocus });
    } else {
      // Break phase
      if (newRemaining <= 0) {
        // Break over, start next focus
        set({
          phase: 'focus',
          secondsRemaining: state.focusMinutes * 60,
        });
        return;
      }
      set({ secondsRemaining: newRemaining });
    }
  },

  pause: () => set({ running: false }),
  resume: () => set({ running: true }),

  skipBreak: () => {
    const state = get();
    if (state.phase !== 'break') return;
    set({
      phase: 'focus',
      secondsRemaining: state.focusMinutes * 60,
    });
  },

  endSession: async (status) => {
    const state = get();
    if (!state.sessionId) return;

    const supabase = createClient();
    await supabase.from('focus_sessions').update({
      status,
      completed_pomodoros: state.completedPomodoros,
      total_focus_seconds: state.totalFocusSeconds,
      ended_at: new Date().toISOString(),
    }).eq('id', state.sessionId);

    set({
      sessionId: null,
      phase: 'idle',
      running: false,
      secondsRemaining: 0,
      completedPomodoros: 0,
      totalFocusSeconds: 0,
    });
  },

  reset: () => set({
    sessionId: null,
    phase: 'idle',
    running: false,
    secondsRemaining: 0,
    completedPomodoros: 0,
    totalFocusSeconds: 0,
    label: '',
    spotifyPlaylistUri: null,
  }),
}));
