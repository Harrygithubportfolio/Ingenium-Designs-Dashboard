import { create } from 'zustand';
import type { FitnessProfile, FitnessAchievement, PersonalRecordDB } from '@/lib/fitness/gamification-types';
import {
  fetchFitnessProfile,
  fetchAchievements,
  fetchLatestPRsByExercise,
  fetchPRCount,
} from '@/lib/fitness/gamification-queries';
import { createClient } from '@/lib/supabase/client';

interface FitnessProfileState {
  profile: FitnessProfile | null;
  achievements: FitnessAchievement[];
  recentPRs: PersonalRecordDB[];
  prCount: number;
  loading: boolean;

  fetchProfile: () => Promise<void>;
  fetchAchievements: () => Promise<void>;
  fetchRecentPRs: () => Promise<void>;
  fetchAll: () => Promise<void>;
}

export const useFitnessProfile = create<FitnessProfileState>((set, get) => ({
  profile: null,
  achievements: [],
  recentPRs: [],
  prCount: 0,
  loading: false,

  fetchProfile: async () => {
    try {
      const supabase = createClient();
      const profile = await fetchFitnessProfile(supabase);
      set({ profile });
    } catch (err) {
      console.error('fetchProfile error:', err);
    }
  },

  fetchAchievements: async () => {
    try {
      const supabase = createClient();
      const achievements = await fetchAchievements(supabase);
      set({ achievements });
    } catch (err) {
      console.error('fetchAchievements error:', err);
    }
  },

  fetchRecentPRs: async () => {
    try {
      const supabase = createClient();
      const [prs, count] = await Promise.all([
        fetchLatestPRsByExercise(supabase),
        fetchPRCount(supabase),
      ]);
      set({ recentPRs: prs, prCount: count });
    } catch (err) {
      console.error('fetchRecentPRs error:', err);
    }
  },

  fetchAll: async () => {
    set({ loading: true });
    await Promise.all([
      get().fetchProfile(),
      get().fetchAchievements(),
      get().fetchRecentPRs(),
    ]);
    set({ loading: false });
  },
}));
