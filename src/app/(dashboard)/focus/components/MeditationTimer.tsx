'use client';

import { useState, useEffect, useRef } from 'react';
import ProgressRing from '@/components/shared/charts/ProgressRing';

const presets = [3, 5, 10, 15, 20]; // minutes

export default function MeditationTimer() {
  const [selectedMinutes, setSelectedMinutes] = useState(10);
  const [customMinutes, setCustomMinutes] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSeconds = selectedMinutes * 60;

  const startMeditation = () => {
    const mins = customMinutes ? parseInt(customMinutes, 10) : selectedMinutes;
    if (isNaN(mins) || mins < 1 || mins > 60) return;
    setSelectedMinutes(mins);
    setSecondsRemaining(mins * 60);
    setIsActive(true);
    setIsPaused(false);
  };

  const pauseMeditation = () => setIsPaused(true);
  const resumeMeditation = () => setIsPaused(false);

  const resetMeditation = () => {
    setIsActive(false);
    setIsPaused(false);
    setSecondsRemaining(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  // Timer tick
  useEffect(() => {
    if (!isActive || isPaused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          setIsActive(false);
          setIsPaused(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, isPaused]);

  const formatTime = (secs: number): string => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const elapsed = totalSeconds - secondsRemaining;
  const isComplete = isActive === false && secondsRemaining === 0 && elapsed > 0;

  // Idle state — setup
  if (!isActive && !isComplete) {
    return (
      <div className="bg-gradient-to-br from-card to-inner rounded-2xl border border-edge p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
            <svg className="w-5 h-5 text-heading" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-heading">Meditation Timer</h3>
            <p className="text-xs text-dim">Choose a duration and find stillness</p>
          </div>
        </div>

        {/* Duration presets */}
        <div className="flex flex-wrap gap-2 mb-4">
          {presets.map((mins) => (
            <button
              key={mins}
              type="button"
              onClick={() => { setSelectedMinutes(mins); setCustomMinutes(''); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedMinutes === mins && !customMinutes
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  : 'bg-inner border border-edge text-sub hover:border-purple-500/20'
              }`}
            >
              {mins} min
            </button>
          ))}
        </div>

        {/* Custom duration */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-dim">Custom:</span>
          <input
            type="number"
            min={1}
            max={60}
            value={customMinutes}
            onChange={(e) => setCustomMinutes(e.target.value)}
            placeholder="1-60"
            className="w-20 px-3 py-1.5 bg-inner border border-edge rounded-lg text-sm text-heading placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-colors"
          />
          <span className="text-xs text-dim">minutes</span>
        </div>

        {/* Start button */}
        <button
          type="button"
          onClick={startMeditation}
          className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl text-white font-medium hover:opacity-90 transition-opacity"
        >
          Begin Meditation
        </button>
      </div>
    );
  }

  // Complete state
  if (isComplete) {
    return (
      <div className="bg-gradient-to-br from-card to-inner rounded-2xl border border-edge p-5">
        <div className="flex flex-col items-center py-8">
          <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-heading mb-1">Session Complete</h3>
          <p className="text-sm text-sub mb-1">{selectedMinutes} minute meditation</p>
          <p className="text-xs text-dim mb-6">Well done — take a moment before continuing.</p>
          <button
            type="button"
            onClick={resetMeditation}
            className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            New Session
          </button>
        </div>
      </div>
    );
  }

  // Active state — timer
  return (
    <div className="bg-gradient-to-br from-card to-inner rounded-2xl border border-edge p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-semibold text-heading">Meditation</h3>
          <p className="text-xs text-dim">{selectedMinutes} min session</p>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${isPaused ? 'bg-amber-400' : 'bg-purple-400 animate-pulse'}`} />
          <span className="text-xs text-sub">{isPaused ? 'Paused' : 'In progress'}</span>
        </div>
      </div>

      {/* Timer ring */}
      <div className="flex flex-col items-center mb-6">
        <ProgressRing
          value={elapsed}
          max={totalSeconds}
          size={180}
          strokeWidth={6}
          colour="rgb(168, 85, 247)"
          label={formatTime(secondsRemaining)}
          sublabel={isPaused ? 'paused' : 'remaining'}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        {isPaused ? (
          <button
            type="button"
            onClick={resumeMeditation}
            className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Resume
          </button>
        ) : (
          <button
            type="button"
            onClick={pauseMeditation}
            className="px-6 py-2.5 bg-elevated border border-edge rounded-xl text-sub text-sm font-medium hover:border-purple-500/30 transition-all"
          >
            Pause
          </button>
        )}
        <button
          type="button"
          onClick={resetMeditation}
          className="px-4 py-2.5 bg-elevated border border-edge rounded-xl text-dim text-sm font-medium hover:text-sub hover:border-red-500/30 transition-all"
        >
          End
        </button>
      </div>
    </div>
  );
}
