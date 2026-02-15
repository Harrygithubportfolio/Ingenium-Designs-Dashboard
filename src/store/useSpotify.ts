import { create } from 'zustand';
import type {
  SpotifyPlaylist,
  SpotifyTrack,
} from '@/lib/spotify/types';

interface SpotifyConnection {
  id: string;
  spotify_user_id: string | null;
  display_name: string | null;
  product: 'free' | 'premium' | 'open';
  is_active: boolean;
}

interface SpotifyState {
  // Connection
  connection: SpotifyConnection | null;
  loading: boolean;

  // Playlists
  playlists: SpotifyPlaylist[];
  playlistsLoading: boolean;

  // Player state (updated by SDK hook)
  currentTrack: SpotifyTrack | null;
  isPlaying: boolean;
  progressMs: number;
  durationMs: number;
  shuffleState: boolean;
  repeatMode: 0 | 1 | 2; // 0=off, 1=context, 2=track
  volume: number;
  deviceId: string | null;
  sdkReady: boolean;

  // Actions
  fetchConnection: () => Promise<void>;
  disconnect: () => Promise<void>;
  fetchPlaylists: () => Promise<void>;
  playContext: (uri: string, offset?: number) => Promise<void>;
  setPlayerState: (state: Partial<SpotifyState>) => void;
}

export const useSpotify = create<SpotifyState>((set, get) => ({
  // Initial state
  connection: null,
  loading: false,
  playlists: [],
  playlistsLoading: false,
  currentTrack: null,
  isPlaying: false,
  progressMs: 0,
  durationMs: 0,
  shuffleState: false,
  repeatMode: 0,
  volume: 0.5,
  deviceId: null,
  sdkReady: false,

  fetchConnection: async () => {
    set({ loading: true });
    try {
      const res = await fetch('/api/spotify/token');
      if (res.ok) {
        // Token endpoint succeeded — we have a connection
        // Fetch the connection details from the playlists endpoint indirectly,
        // or just mark as connected. We'll fetch connection details properly.
        const tokenRes = await fetch('/api/spotify/token');
        if (tokenRes.ok) {
          // We have a valid connection — fetch the actual connection info
          // For now, we'll get it from a lightweight check
          set({
            connection: {
              id: 'active',
              spotify_user_id: null,
              display_name: null,
              product: 'premium',
              is_active: true,
            },
          });
        }
      } else {
        set({ connection: null });
      }
    } catch {
      set({ connection: null });
    } finally {
      set({ loading: false });
    }
  },

  disconnect: async () => {
    try {
      await fetch('/api/spotify/disconnect', { method: 'POST' });
      set({
        connection: null,
        playlists: [],
        currentTrack: null,
        isPlaying: false,
        sdkReady: false,
        deviceId: null,
      });
    } catch (err) {
      console.error('Spotify disconnect error:', err);
    }
  },

  fetchPlaylists: async () => {
    set({ playlistsLoading: true });
    try {
      const res = await fetch('/api/spotify/playlists');
      if (res.ok) {
        const data = await res.json();
        set({ playlists: data.items ?? [] });
      }
    } catch (err) {
      console.error('Spotify playlists error:', err);
    } finally {
      set({ playlistsLoading: false });
    }
  },

  playContext: async (uri: string, offset?: number) => {
    const { deviceId } = get();
    try {
      await fetch('/api/spotify/play', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context_uri: uri,
          device_id: deviceId,
          offset: offset !== undefined ? offset : 0,
        }),
      });
    } catch (err) {
      console.error('Spotify play error:', err);
    }
  },

  setPlayerState: (state) => {
    set(state);
  },
}));
