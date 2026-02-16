import { create } from 'zustand';
import type { StravaConnection, StravaActivity } from '@/lib/strava/types';

interface StravaStats {
  totalDistance: number;      // metres
  totalTime: number;          // seconds
  totalElevation: number;     // metres
  activityCount: number;
  thisWeekCount: number;
  thisMonthCount: number;
}

interface StravaState {
  // Connection
  connection: StravaConnection | null;
  loading: boolean;

  // Activities
  activities: StravaActivity[];
  total: number;
  syncing: boolean;
  error: string | null;

  // Filters
  sportTypeFilter: string | null;

  // Computed stats
  stats: StravaStats;

  // Actions
  fetchActivities: (sportType?: string | null) => Promise<void>;
  syncActivities: (full?: boolean) => Promise<void>;
  disconnect: () => Promise<void>;
  setSportTypeFilter: (type: string | null) => void;
}

function computeStats(activities: StravaActivity[]): StravaStats {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay() + 1); // Monday
  weekStart.setHours(0, 0, 0, 0);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  let totalDistance = 0;
  let totalTime = 0;
  let totalElevation = 0;
  let thisWeekCount = 0;
  let thisMonthCount = 0;

  for (const a of activities) {
    totalDistance += a.distance_m ?? 0;
    totalTime += a.moving_time_sec ?? 0;
    totalElevation += a.total_elevation_gain_m ?? 0;

    const date = new Date(a.start_date);
    if (date >= weekStart) thisWeekCount++;
    if (date >= monthStart) thisMonthCount++;
  }

  return {
    totalDistance,
    totalTime,
    totalElevation,
    activityCount: activities.length,
    thisWeekCount,
    thisMonthCount,
  };
}

export const useStrava = create<StravaState>((set, get) => ({
  connection: null,
  loading: false,
  activities: [],
  total: 0,
  syncing: false,
  error: null,
  sportTypeFilter: null,
  stats: {
    totalDistance: 0,
    totalTime: 0,
    totalElevation: 0,
    activityCount: 0,
    thisWeekCount: 0,
    thisMonthCount: 0,
  },

  fetchActivities: async (sportType?: string | null) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams({ limit: '200' });
      const filter = sportType ?? get().sportTypeFilter;
      if (filter) params.set('sport_type', filter);

      const res = await fetch(`/api/strava/activities?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const { data, error } = await res.json();
      if (error) throw new Error(error.message);

      const activities: StravaActivity[] = data.activities ?? [];
      set({
        connection: data.connection ?? null,
        activities,
        total: data.total ?? 0,
        stats: computeStats(activities),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch activities';
      set({ error: message, connection: null });
    } finally {
      set({ loading: false });
    }
  },

  syncActivities: async (full = false) => {
    set({ syncing: true, error: null });
    try {
      const url = full ? '/api/strava/sync?full=true' : '/api/strava/sync';
      const res = await fetch(url, { method: 'POST' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const { error } = await res.json();
      if (error) throw new Error(error.message);

      // Re-fetch activities after sync
      await get().fetchActivities();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sync failed';
      set({ error: message });
    } finally {
      set({ syncing: false });
    }
  },

  disconnect: async () => {
    try {
      await fetch('/api/strava/disconnect', { method: 'POST' });
      set({
        connection: null,
        activities: [],
        total: 0,
        syncing: false,
        error: null,
        sportTypeFilter: null,
        stats: {
          totalDistance: 0,
          totalTime: 0,
          totalElevation: 0,
          activityCount: 0,
          thisWeekCount: 0,
          thisMonthCount: 0,
        },
      });
    } catch (err) {
      console.error('Strava disconnect error:', err);
    }
  },

  setSportTypeFilter: (type) => {
    set({ sportTypeFilter: type });
    get().fetchActivities(type);
  },
}));
