import { create } from 'zustand';
import type { CalendarEvent, CalendarConnection, CalendarEventInput } from '@/lib/calendar/types';

interface CalendarState {
  events: CalendarEvent[];
  connection: CalendarConnection | null;
  loading: boolean;
  syncing: boolean;
  lastSyncError: string | null;

  fetchEvents: (from: string, to: string) => Promise<void>;
  fetchConnection: () => Promise<void>;
  addEvent: (input: CalendarEventInput) => Promise<CalendarEvent | null>;
  updateEvent: (id: string, input: Partial<CalendarEventInput>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  triggerSync: () => Promise<void>;
  disconnectGoogle: () => Promise<void>;
}

export const useCalendar = create<CalendarState>((set, get) => ({
  events: [],
  connection: null,
  loading: false,
  syncing: false,
  lastSyncError: null,

  fetchEvents: async (from, to) => {
    set({ loading: true });
    try {
      const res = await fetch(`/api/calendar/events?from=${from}&to=${to}`);
      const { data } = await res.json();
      set({ events: data ?? [], loading: false });
    } catch (err) {
      console.error('fetchEvents error:', err);
      set({ loading: false });
    }
  },

  fetchConnection: async () => {
    try {
      const res = await fetch('/api/calendar/connection');
      const { data } = await res.json();
      set({ connection: data });
    } catch (err) {
      console.error('fetchConnection error:', err);
    }
  },

  addEvent: async (input) => {
    try {
      const res = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const { data } = await res.json();
      if (data) {
        set((state) => ({ events: [...state.events, data] }));
      }
      return data ?? null;
    } catch (err) {
      console.error('addEvent error:', err);
      return null;
    }
  },

  updateEvent: async (id, input) => {
    try {
      const res = await fetch(`/api/calendar/events/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const { data } = await res.json();
      if (data) {
        set((state) => ({
          events: state.events.map((e) => (e.id === id ? data : e)),
        }));
      }
    } catch (err) {
      console.error('updateEvent error:', err);
    }
  },

  deleteEvent: async (id) => {
    try {
      await fetch(`/api/calendar/events/${id}`, { method: 'DELETE' });
      set((state) => ({ events: state.events.filter((e) => e.id !== id) }));
    } catch (err) {
      console.error('deleteEvent error:', err);
    }
  },

  triggerSync: async () => {
    set({ syncing: true, lastSyncError: null });
    try {
      const res = await fetch('/api/calendar/sync', { method: 'POST' });
      const { error } = await res.json();
      if (error) {
        set({ lastSyncError: error.message, syncing: false });
      } else {
        set({ syncing: false });
        // Re-fetch events after sync — use a wide date range
        const today = new Date();
        const from = new Date(today);
        from.setMonth(from.getMonth() - 3);
        const to = new Date(today);
        to.setMonth(to.getMonth() + 6);
        await get().fetchEvents(
          from.toISOString().split('T')[0],
          to.toISOString().split('T')[0]
        );
      }
    } catch (err) {
      console.error('triggerSync error:', err);
      set({ syncing: false, lastSyncError: 'Sync failed. Please try again.' });
    }
  },

  disconnectGoogle: async () => {
    try {
      await fetch('/api/calendar/google/disconnect', { method: 'POST' });
      set({ connection: null });
    } catch (err) {
      console.error('disconnectGoogle error:', err);
    }
  },
}));
