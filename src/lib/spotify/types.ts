// ============================================
// SPOTIFY INTEGRATION — TYPE DEFINITIONS
// ============================================

// --- Database entity ---

export interface SpotifyConnection {
  id: string;
  user_id: string;
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
  spotify_user_id: string | null;
  display_name: string | null;
  product: 'free' | 'premium' | 'open';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// --- Spotify Web API entities ---

export interface SpotifyImage {
  url: string;
  height: number | null;
  width: number | null;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  uri: string;
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  images: SpotifyImage[];
  uri: string;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  uri: string;
  duration_ms: number;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string | null;
  images: SpotifyImage[];
  tracks: { total: number };
  owner: { display_name: string };
  uri: string;
}

export interface SpotifyDevice {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
  volume_percent: number;
}

export interface SpotifyPlaybackState {
  is_playing: boolean;
  item: SpotifyTrack | null;
  progress_ms: number;
  device: SpotifyDevice;
  shuffle_state: boolean;
  repeat_state: 'off' | 'context' | 'track';
}

export interface SpotifyUserProfile {
  id: string;
  display_name: string;
  product: 'free' | 'premium' | 'open';
  images: SpotifyImage[];
}

// Web Playback SDK types are declared in src/types/spotify-sdk.d.ts
