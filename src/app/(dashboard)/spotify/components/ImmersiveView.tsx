'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSpotify } from '@/store/useSpotify';

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function ImmersiveView({
  player,
}: {
  player: Spotify.Player | null;
}) {
  const {
    currentTrack,
    isPlaying,
    progressMs,
    durationMs,
    setPlayerState,
  } = useSpotify();

  const [controlsVisible, setControlsVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Progress ticker
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);

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

  // Auto-hide controls after 2 seconds of inactivity
  const resetTimer = useCallback(() => {
    setControlsVisible(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setControlsVisible(false);
    }, 2000);
  }, []);

  useEffect(() => {
    resetTimer();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [resetTimer]);

  const handleMouseMove = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

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

  const albumArt =
    currentTrack?.album?.images?.[0]?.url ??
    currentTrack?.album?.images?.[1]?.url;

  const progressPercent = durationMs > 0 ? (progressMs / durationMs) * 100 : 0;

  if (!currentTrack) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 bg-card rounded-2xl border border-edge">
        <div className="w-24 h-24 rounded-full bg-elevated flex items-center justify-center">
          <svg className="w-12 h-12 text-dim" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        </div>
        <p className="text-sub text-sm">Play a track to enter immersive mode</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onClick={handleMouseMove}
      className={`h-full relative overflow-hidden rounded-2xl select-none ${
        controlsVisible ? 'cursor-default' : 'cursor-none'
      }`}
    >
      {/* Blurred background */}
      {albumArt && (
        <div className="absolute inset-0">
          <img
            src={albumArt}
            alt=""
            className="w-full h-full object-cover blur-3xl scale-125 opacity-50"
          />
          <div className="absolute inset-0 bg-black/50" />
        </div>
      )}

      {/* Centred album art */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 z-10">
        {albumArt ? (
          <div className="relative">
            <img
              src={albumArt}
              alt={currentTrack.album.name}
              className="w-56 h-56 md:w-72 md:h-72 lg:w-80 lg:h-80 xl:w-96 xl:h-96 rounded-2xl object-cover shadow-2xl"
              style={{
                boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
              }}
            />
            {/* Glow effect */}
            <div
              className="absolute -inset-4 rounded-3xl opacity-30 blur-2xl -z-10"
              style={{
                backgroundImage: albumArt ? `url(${albumArt})` : undefined,
                backgroundSize: 'cover',
              }}
            />
          </div>
        ) : (
          <div className="w-56 h-56 md:w-72 md:h-72 rounded-2xl bg-elevated/50 flex items-center justify-center">
            <svg className="w-16 h-16 text-dim" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
        )}

        {/* Track info — always visible when controls are visible */}
        <div
          className={`text-center transition-opacity duration-500 ${
            controlsVisible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <p className="text-xl md:text-2xl font-bold text-white drop-shadow-lg">
            {currentTrack.name}
          </p>
          <p className="text-sm md:text-base text-white/70 mt-1 drop-shadow">
            {currentTrack.artists.map((a) => a.name).join(', ')}
          </p>
        </div>
      </div>

      {/* Bottom controls overlay */}
      <div
        className={`absolute bottom-0 inset-x-0 z-20 transition-opacity duration-500 ${
          controlsVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="bg-gradient-to-t from-black/70 to-transparent pt-12 pb-6 px-6">
          {/* Progress bar */}
          <div className="flex items-center gap-2 mb-4 max-w-md mx-auto">
            <span className="text-[10px] text-white/50 w-8 text-right tabular-nums">
              {formatTime(progressMs)}
            </span>
            <div className="flex-1 relative h-1">
              <div className="absolute inset-0 rounded-full bg-white/20" />
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-[#1db954] transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[10px] text-white/50 w-8 tabular-nums">
              {formatTime(durationMs)}
            </span>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-6">
            <button
              type="button"
              onClick={handlePrevious}
              className="p-2 text-white/70 hover:text-white transition-colors"
              title="Previous"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
              </svg>
            </button>

            <button
              type="button"
              onClick={handleTogglePlay}
              className="w-14 h-14 rounded-full bg-white hover:bg-white/90 text-black flex items-center justify-center transition-colors shadow-2xl"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="p-2 text-white/70 hover:text-white transition-colors"
              title="Next"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
