'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useSpotify } from '@/store/useSpotify';

/**
 * Custom hook that manages the Spotify Web Playback SDK lifecycle.
 * Loads the SDK script, creates a Player instance, and syncs state to Zustand.
 */
export function useSpotifyPlayer() {
  const playerRef = useRef<Spotify.Player | null>(null);
  const tokenRef = useRef<string | null>(null);
  const {
    connection,
    setPlayerState,
  } = useSpotify();

  const isPremium = connection?.product === 'premium';

  // Fetch a fresh token
  const fetchToken = useCallback(async (): Promise<string | null> => {
    try {
      const res = await fetch('/api/spotify/token');
      if (!res.ok) return null;
      const data = await res.json();
      tokenRef.current = data.access_token;
      return data.access_token;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!connection || !isPremium) return;

    let mounted = true;
    let scriptEl: HTMLScriptElement | null = null;

    const initPlayer = async () => {
      const token = await fetchToken();
      if (!token || !mounted) return;

      // Define the ready callback before loading the script
      window.onSpotifyWebPlaybackSDKReady = () => {
        if (!mounted) return;

        const player = new window.Spotify.Player({
          name: 'Ingenium Dashboard',
          getOAuthToken: (cb) => {
            // The SDK calls this when it needs a (fresh) token
            fetchToken().then((t) => cb(t || ''));
          },
          volume: 0.5,
        });

        // Ready
        player.addListener('ready', ({ device_id }) => {
          if (!mounted) return;
          setPlayerState({ deviceId: device_id, sdkReady: true });
        });

        // Not ready
        player.addListener('not_ready', () => {
          if (!mounted) return;
          setPlayerState({ sdkReady: false, deviceId: null });
        });

        // State changes
        player.addListener('player_state_changed', (state) => {
          if (!mounted || !state) return;

          const track = state.track_window.current_track;
          setPlayerState({
            isPlaying: !state.paused,
            progressMs: state.position,
            durationMs: state.duration,
            shuffleState: state.shuffle,
            repeatMode: state.repeat_mode,
            currentTrack: track
              ? {
                  id: track.id,
                  name: track.name,
                  uri: track.uri,
                  duration_ms: track.duration_ms,
                  artists: track.artists.map((a) => ({
                    id: '',
                    name: a.name,
                    uri: a.uri,
                  })),
                  album: {
                    id: '',
                    name: track.album.name,
                    uri: track.album.uri,
                    images: track.album.images,
                  },
                }
              : null,
          });
        });

        // Errors
        player.addListener('initialization_error', ({ message }) => {
          console.error('Spotify SDK init error:', message);
        });
        player.addListener('authentication_error', ({ message }) => {
          console.error('Spotify SDK auth error:', message);
        });
        player.addListener('account_error', ({ message }) => {
          console.error('Spotify SDK account error:', message);
        });

        player.connect();
        playerRef.current = player;
      };

      // Load the SDK script if not already loaded
      if (!document.getElementById('spotify-sdk')) {
        scriptEl = document.createElement('script');
        scriptEl.id = 'spotify-sdk';
        scriptEl.src = 'https://sdk.scdn.co/spotify-player.js';
        scriptEl.async = true;
        document.body.appendChild(scriptEl);
      } else if (window.Spotify) {
        // Script already loaded — trigger the callback manually
        window.onSpotifyWebPlaybackSDKReady();
      }
    };

    initPlayer();

    return () => {
      mounted = false;
      if (playerRef.current) {
        playerRef.current.disconnect();
        playerRef.current = null;
      }
      setPlayerState({ sdkReady: false, deviceId: null });
    };
  }, [connection, isPremium, fetchToken, setPlayerState]);

  return {
    player: playerRef.current,
    isPremium,
  };
}
