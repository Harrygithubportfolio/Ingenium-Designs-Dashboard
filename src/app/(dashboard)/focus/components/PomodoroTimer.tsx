'use client';

import { useState, useEffect, useRef } from 'react';
import { useFocusTimer, type FocusPhase } from '@/store/useFocusTimer';
import { ProgressRing } from '@/components/shared/charts';

const PRESETS = [
  { label: '25/5', focus: 25, break: 5, pomodoros: 4 },
  { label: '50/10', focus: 50, break: 10, pomodoros: 3 },
  { label: '90/20', focus: 90, break: 20, pomodoros: 2 },
];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

const PHASE_COLOURS: Record<FocusPhase, string> = {
  idle: 'var(--accent)',
  focus: '#f59e0b',
  break: '#10b981',
};

export default function PomodoroTimer() {
  const state = useFocusTimer();
  const {
    phase, secondsRemaining, focusMinutes, breakMinutes, totalPomodoros,
    completedPomodoros, totalFocusSeconds, label, running,
    startSession, tick, pause, resume, skipBreak, endSession, reset,
  } = state;

  // Setup form
  const [formFocus, setFormFocus] = useState(25);
  const [formBreak, setFormBreak] = useState(5);
  const [formPomodoros, setFormPomodoros] = useState(4);
  const [formLabel, setFormLabel] = useState('');

  // Timer interval
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => tick(), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, tick]);

  const handleStart = () => {
    startSession({
      focusMinutes: formFocus,
      breakMinutes: formBreak,
      totalPomodoros: formPomodoros,
      label: formLabel,
    });
  };

  const totalPhaseSeconds = phase === 'focus' ? focusMinutes * 60 : phase === 'break' ? breakMinutes * 60 : 0;
  const elapsed = totalPhaseSeconds - secondsRemaining;
  const colour = PHASE_COLOURS[phase];

  // Idle state — show setup
  if (phase === 'idle') {
    return (
      <div className="space-y-5">
        {/* Presets */}
        <div>
          <label className="text-xs text-dim uppercase tracking-wide mb-2 block">Preset</label>
          <div className="flex gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => { setFormFocus(p.focus); setFormBreak(p.break); setFormPomodoros(p.pomodoros); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  formFocus === p.focus && formBreak === p.break
                    ? 'bg-accent text-white'
                    : 'bg-elevated text-sub hover:text-heading'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom settings */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-dim uppercase tracking-wide mb-1 block">Focus (min)</label>
            <input
              type="number"
              value={formFocus}
              onChange={(e) => setFormFocus(Number(e.target.value))}
              min={1}
              max={180}
              className="w-full px-3 py-2 rounded-lg bg-inner border border-edge text-heading text-sm text-center"
            />
          </div>
          <div>
            <label className="text-xs text-dim uppercase tracking-wide mb-1 block">Break (min)</label>
            <input
              type="number"
              value={formBreak}
              onChange={(e) => setFormBreak(Number(e.target.value))}
              min={1}
              max={60}
              className="w-full px-3 py-2 rounded-lg bg-inner border border-edge text-heading text-sm text-center"
            />
          </div>
          <div>
            <label className="text-xs text-dim uppercase tracking-wide mb-1 block">Rounds</label>
            <input
              type="number"
              value={formPomodoros}
              onChange={(e) => setFormPomodoros(Number(e.target.value))}
              min={1}
              max={12}
              className="w-full px-3 py-2 rounded-lg bg-inner border border-edge text-heading text-sm text-center"
            />
          </div>
        </div>

        {/* Label */}
        <div>
          <label className="text-xs text-dim uppercase tracking-wide mb-1 block">What are you working on?</label>
          <input
            type="text"
            value={formLabel}
            onChange={(e) => setFormLabel(e.target.value)}
            placeholder="e.g. Write project proposal"
            className="w-full px-3 py-2 rounded-lg bg-inner border border-edge text-heading text-sm placeholder-dim"
          />
        </div>

        {/* Start button */}
        <button
          type="button"
          onClick={handleStart}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-accent to-accent-secondary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Start Focus Session
        </button>
      </div>
    );
  }

  // Active state — show timer
  return (
    <div className="flex flex-col items-center gap-5">
      {/* Phase label */}
      <div className="flex items-center gap-2">
        <span
          className="w-2.5 h-2.5 rounded-full animate-pulse"
          style={{ backgroundColor: colour }}
        />
        <span className="text-sm font-medium text-heading capitalize">{phase}</span>
        {label && <span className="text-xs text-dim">— {label}</span>}
      </div>

      {/* Timer ring */}
      <div className="relative">
        <ProgressRing
          value={elapsed}
          max={totalPhaseSeconds}
          size={200}
          strokeWidth={8}
          colour={colour}
          label={formatTime(secondsRemaining)}
        />
      </div>

      {/* Pomodoro dots */}
      <div className="flex items-center gap-2">
        {Array.from({ length: totalPomodoros }).map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-colors ${
              i < completedPomodoros ? 'bg-accent' : 'bg-elevated'
            }`}
          />
        ))}
        <span className="text-xs text-dim ml-2">{completedPomodoros}/{totalPomodoros}</span>
      </div>

      {/* Total focus time */}
      <p className="text-xs text-dim">
        Total focus time: {Math.floor(totalFocusSeconds / 60)}m {totalFocusSeconds % 60}s
      </p>

      {/* Controls */}
      <div className="flex items-center gap-3">
        {running ? (
          <button
            type="button"
            onClick={pause}
            className="px-6 py-2.5 rounded-xl bg-elevated text-heading text-sm font-medium hover:bg-inner transition-colors"
          >
            Pause
          </button>
        ) : (
          <button
            type="button"
            onClick={resume}
            className="px-6 py-2.5 rounded-xl bg-accent text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Resume
          </button>
        )}

        {phase === 'break' && (
          <button
            type="button"
            onClick={skipBreak}
            className="px-4 py-2.5 rounded-xl bg-elevated text-sub text-sm font-medium hover:text-heading transition-colors"
          >
            Skip Break
          </button>
        )}

        <button
          type="button"
          onClick={() => endSession('abandoned')}
          className="px-4 py-2.5 rounded-xl bg-elevated text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors"
        >
          End Session
        </button>
      </div>
    </div>
  );
}
