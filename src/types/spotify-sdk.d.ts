/**
 * Type declarations for the Spotify Web Playback SDK.
 * Loaded via <script src="https://sdk.scdn.co/spotify-player.js">
 */

interface Window {
  onSpotifyWebPlaybackSDKReady: () => void;
  Spotify: typeof Spotify;
}

declare namespace Spotify {
  interface PlayerInit {
    name: string;
    getOAuthToken: (cb: (token: string) => void) => void;
    volume?: number;
  }

  interface WebPlaybackTrack {
    uri: string;
    id: string;
    name: string;
    duration_ms: number;
    artists: { uri: string; name: string }[];
    album: {
      uri: string;
      name: string;
      images: { url: string; height: number; width: number }[];
    };
  }

  interface WebPlaybackState {
    paused: boolean;
    position: number;
    duration: number;
    track_window: {
      current_track: WebPlaybackTrack;
      previous_tracks: WebPlaybackTrack[];
      next_tracks: WebPlaybackTrack[];
    };
    shuffle: boolean;
    repeat_mode: 0 | 1 | 2;
  }

  interface WebPlaybackError {
    message: string;
  }

  interface ReadyEvent {
    device_id: string;
  }

  class Player {
    constructor(options: PlayerInit);
    connect(): Promise<boolean>;
    disconnect(): void;
    addListener(event: 'ready', cb: (data: ReadyEvent) => void): void;
    addListener(event: 'not_ready', cb: (data: ReadyEvent) => void): void;
    addListener(event: 'player_state_changed', cb: (state: WebPlaybackState | null) => void): void;
    addListener(event: 'initialization_error', cb: (error: WebPlaybackError) => void): void;
    addListener(event: 'authentication_error', cb: (error: WebPlaybackError) => void): void;
    addListener(event: 'account_error', cb: (error: WebPlaybackError) => void): void;
    removeListener(event: string): void;
    getCurrentState(): Promise<WebPlaybackState | null>;
    setName(name: string): Promise<void>;
    getVolume(): Promise<number>;
    setVolume(volume: number): Promise<void>;
    pause(): Promise<void>;
    resume(): Promise<void>;
    togglePlay(): Promise<void>;
    seek(position_ms: number): Promise<void>;
    previousTrack(): Promise<void>;
    nextTrack(): Promise<void>;
  }
}
