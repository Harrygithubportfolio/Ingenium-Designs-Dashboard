'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useSpotify } from '@/store/useSpotify';

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function NowPlaying({ player }: { player: Spotify.Player | null }) {
  const {
    currentTrack,
    isPlaying,
    progressMs,
    durationMs,
    shuffleState,
    repeatMode,
    volume,
    sdkReady,
    setPlayerState,
  } = useSpotify();

  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Tick progress forward while playing
  useEffect(() => {
    if (isPlaying) {
      progressInterval.current = setInterval(() => {
        setPlayerState({ progressMs: useSpotify.getState().progressMs + 500 });
      }, 500);
    }
    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [isPlaying, setPlayerState]);

  const handleTogglePlay = useCallback(async () => {
    if (!player) return;
    await player.togglePlay();
  }, [player]);

  const handlePrevious = useCallback(async () => {
    if (!player) return;
    await player.previousTrack();
  }, [player]);

  const handleNext = useCallback(async () => {
    if (!player) return;
    await player.nextTrack();
  }, [player]);

  const handleSeek = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!player) return;
      const pos = parseInt(e.target.value, 10);
      await player.seek(pos);
      setPlayerState({ progressMs: pos });
    },
    [player, setPlayerState]
  );

  const handleVolume = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!player) return;
      const vol = parseFloat(e.target.value);
      await player.setVolume(vol);
      setPlayerState({ volume: vol });
    },
    [player, setPlayerState]
  );

  const albumArt =
    currentTrack?.album?.images?.[0]?.url ??
    currentTrack?.album?.images?.[1]?.url;

  if (!sdkReady) {
    return (
      <div className="bg-card rounded-2xl border border-edge p-6 flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-full bg-elevated flex items-center justify-center">
          <svg className="w-6 h-6 text-dim animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        </div>
        <p className="text-sm text-dim">Connecting to Spotify...</p>
      </div>
    );
  }

  if (!currentTrack) {
    return (
      <div className="bg-card rounded-2xl border border-edge p-6 flex flex-col items-center justify-center gap-3">
        <div className="w-16 h-16 rounded-full bg-elevated flex items-center justify-center">
          <svg className="w-8 h-8 text-dim" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        </div>
        <p className="text-sm text-sub">Nothing playing</p>
        <p className="text-xs text-dim">Pick a playlist to get started</p>
      </div>
    );
  }

  const progressPercent = durationMs > 0 ? (progressMs / durationMs) * 100 : 0;

  return (
    <div className="bg-card rounded-2xl border border-edge p-5 flex flex-col gap-4">
      {/* Track info */}
      <div className="flex items-center gap-4">
        {albumArt ? (
          <img
            src={albumArt}
            alt={currentTrack.album.name}
            className="w-20 h-20 md:w-24 md:h-24 rounded-xl object-cover flex-shrink-0 shadow-lg"
          />
        ) : (
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl bg-elevated flex items-center justify-center flex-shrink-0">
            <svg className="w-8 h-8 text-dim" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm md:text-base font-semibold text-heading truncate">
            {currentTrack.name}
          </p>
          <p className="text-xs md:text-sm text-sub truncate">
            {currentTrack.artists.map((a) => a.name).join(', ')}
          </p>
          <p className="text-[11px] text-dim truncate mt-0.5">
            {currentTrack.album.name}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-dim w-8 text-right tabular-nums">
          {formatTime(progressMs)}
        </span>
        <div className="flex-1 relative h-1.5 group">
          <div className="absolute inset-0 rounded-full bg-elevated" />
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-[#1db954] transition-all"
            style={{ width: `${progressPercent}%` }}
          />
          <input
            type="range"
            min={0}
            max={durationMs}
            value={progressMs}
            onChange={handleSeek}
            className="absolute inset-0 w-full opacity-0 cursor-pointer"
          />
        </div>
        <span className="text-[10px] text-dim w-8 tabular-nums">
          {formatTime(durationMs)}
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        {/* Shuffle */}
        <button
          type="button"
          onClick={() => {
            /* Shuffle toggle requires API call — future enhancement */
          }}
          className={`p-2 rounded-lg transition-colors ${
            shuffleState ? 'text-[#1db954]' : 'text-dim hover:text-sub'
          }`}
          title="Shuffle"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h4l3 9h6l3-9h4M4 20h4l3-9M14 20l3-9" />
          </svg>
        </button>

        {/* Previous */}
        <button
          type="button"
          onClick={handlePrevious}
          className="p-2 rounded-lg text-sub hover:text-heading transition-colors"
          title="Previous"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
          </svg>
        </button>

        {/* Play / Pause */}
        <button
          type="button"
          onClick={handleTogglePlay}
          className="w-12 h-12 rounded-full bg-[#1db954] hover:bg-[#1ed760] text-white flex items-center justify-center transition-colors shadow-lg shadow-[#1db954]/30"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Next */}
        <button
          type="button"
          onClick={handleNext}
          className="p-2 rounded-lg text-sub hover:text-heading transition-colors"
          title="Next"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
          </svg>
        </button>

        {/* Repeat */}
        <button
          type="button"
          onClick={() => {
            /* Repeat toggle requires API call — future enhancement */
          }}
          className={`p-2 rounded-lg transition-colors ${
            repeatMode > 0 ? 'text-[#1db954]' : 'text-dim hover:text-sub'
          }`}
          title="Repeat"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Volume */}
      <div className="flex items-center gap-2 px-2">
        <svg className="w-4 h-4 text-dim flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.536 8.464a5 5 0 010 7.072M12 6.253v11.494m0-11.494L7.5 9.75H4v4.5h3.5L12 17.747m0-11.494A4.978 4.978 0 0114.5 12" />
        </svg>
        <div className="flex-1 relative h-1 group max-w-[120px]">
          <div className="absolute inset-0 rounded-full bg-elevated" />
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-sub transition-all"
            style={{ width: `${volume * 100}%` }}
          />
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={handleVolume}
            className="absolute inset-0 w-full opacity-0 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
