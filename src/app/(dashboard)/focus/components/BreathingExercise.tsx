'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface BreathingTechnique {
  id: string;
  name: string;
  description: string;
  inhale: number;
  holdIn: number;
  exhale: number;
  holdOut: number;
}

const techniques: BreathingTechnique[] = [
  {
    id: 'box',
    name: 'Box Breathing',
    description: 'Equal parts inhale, hold, exhale, hold. Great for calm focus.',
    inhale: 4,
    holdIn: 4,
    exhale: 4,
    holdOut: 4,
  },
  {
    id: '478',
    name: '4-7-8 Technique',
    description: 'Relaxing breath pattern. Excellent for reducing anxiety.',
    inhale: 4,
    holdIn: 7,
    exhale: 8,
    holdOut: 0,
  },
  {
    id: 'calm',
    name: 'Calm Breathing',
    description: 'Simple inhale-exhale. Perfect for beginners.',
    inhale: 4,
    holdIn: 0,
    exhale: 6,
    holdOut: 0,
  },
  {
    id: 'energise',
    name: 'Energising Breath',
    description: 'Quick rhythm to boost alertness and energy.',
    inhale: 2,
    holdIn: 0,
    exhale: 2,
    holdOut: 0,
  },
];

const durations = [2, 5, 10]; // minutes

type Phase = 'inhale' | 'holdIn' | 'exhale' | 'holdOut';

export default function BreathingExercise() {
  const [selectedTechnique, setSelectedTechnique] = useState<BreathingTechnique>(techniques[0]);
  const [selectedDuration, setSelectedDuration] = useState(5);
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<Phase>('inhale');
  const [phaseTimeLeft, setPhaseTimeLeft] = useState(0);
  const [totalSecondsElapsed, setTotalSecondsElapsed] = useState(0);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSeconds = selectedDuration * 60;
  const cycleDuration = selectedTechnique.inhale + selectedTechnique.holdIn + selectedTechnique.exhale + selectedTechnique.holdOut;
  const totalCycles = Math.ceil(totalSeconds / cycleDuration);

  const getPhaseLabel = (p: Phase): string => {
    switch (p) {
      case 'inhale': return 'Breathe in...';
      case 'holdIn': return 'Hold...';
      case 'exhale': return 'Breathe out...';
      case 'holdOut': return 'Hold...';
    }
  };

  const getPhaseColour = (p: Phase): string => {
    switch (p) {
      case 'inhale': return 'text-teal-400';
      case 'holdIn': return 'text-amber-400';
      case 'exhale': return 'text-indigo-400';
      case 'holdOut': return 'text-amber-400';
    }
  };

  // Calculate circle scale based on phase
  const getCircleScale = (): number => {
    const t = selectedTechnique;
    const phaseDuration = t[phase];
    if (phaseDuration === 0) return phase === 'holdIn' || phase === 'inhale' ? 1 : 0.6;

    const progress = 1 - (phaseTimeLeft / phaseDuration);

    switch (phase) {
      case 'inhale': return 0.6 + (0.4 * progress);    // 0.6 → 1.0
      case 'holdIn': return 1.0;
      case 'exhale': return 1.0 - (0.4 * progress);    // 1.0 → 0.6
      case 'holdOut': return 0.6;
    }
  };

  const getNextPhase = useCallback((current: Phase): Phase => {
    const t = selectedTechnique;
    switch (current) {
      case 'inhale':
        return t.holdIn > 0 ? 'holdIn' : 'exhale';
      case 'holdIn':
        return 'exhale';
      case 'exhale':
        return t.holdOut > 0 ? 'holdOut' : 'inhale';
      case 'holdOut':
        return 'inhale';
    }
  }, [selectedTechnique]);

  const startExercise = () => {
    setIsActive(true);
    setPhase('inhale');
    setPhaseTimeLeft(selectedTechnique.inhale);
    setTotalSecondsElapsed(0);
    setCyclesCompleted(0);
  };

  const stopExercise = () => {
    setIsActive(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Timer tick
  useEffect(() => {
    if (!isActive) return;

    intervalRef.current = setInterval(() => {
      setTotalSecondsElapsed(prev => {
        const next = prev + 1;
        if (next >= totalSeconds) {
          stopExercise();
          return prev;
        }
        return next;
      });

      setPhaseTimeLeft(prev => {
        if (prev <= 1) {
          // Move to next phase
          setPhase(currentPhase => {
            const next = getNextPhase(currentPhase);
            if (next === 'inhale') {
              setCyclesCompleted(c => c + 1);
            }
            const t = selectedTechnique;
            const duration = t[next];
            // Skip phases with 0 duration
            if (duration === 0) {
              const afterNext = getNextPhase(next);
              if (afterNext === 'inhale') {
                setCyclesCompleted(c => c + 1);
              }
              setPhaseTimeLeft(t[afterNext]);
              return afterNext;
            }
            setPhaseTimeLeft(duration);
            return next;
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, selectedTechnique, totalSeconds]);

  const scale = isActive ? getCircleScale() : 0.6;
  const progress = totalSecondsElapsed / totalSeconds;

  // Idle state — technique selection
  if (!isActive) {
    return (
      <div className="bg-gradient-to-br from-card to-inner rounded-2xl border border-edge p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center">
            <svg className="w-5 h-5 text-heading" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-heading">Breathing Exercises</h3>
            <p className="text-xs text-dim">Choose a technique and duration</p>
          </div>
        </div>

        {/* Technique selection */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {techniques.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedTechnique(t)}
              className={`p-3 rounded-xl border text-left transition-all ${
                selectedTechnique.id === t.id
                  ? 'bg-teal-500/10 border-teal-500/30 text-teal-400'
                  : 'bg-inner border-edge text-sub hover:border-teal-500/20'
              }`}
            >
              <p className="text-sm font-medium">{t.name}</p>
              <p className="text-[10px] text-dim mt-0.5">{t.description}</p>
            </button>
          ))}
        </div>

        {/* Duration selection */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-dim">Duration:</span>
          {durations.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setSelectedDuration(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedDuration === d
                  ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                  : 'bg-inner border border-edge text-sub hover:border-teal-500/20'
              }`}
            >
              {d} min
            </button>
          ))}
        </div>

        {/* Start button */}
        <button
          type="button"
          onClick={startExercise}
          className="w-full py-3 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl text-white font-medium hover:opacity-90 transition-opacity"
        >
          Begin Breathing Exercise
        </button>
      </div>
    );
  }

  // Active state — breathing animation
  return (
    <div className="bg-gradient-to-br from-card to-inner rounded-2xl border border-edge p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-semibold text-heading">{selectedTechnique.name}</h3>
          <p className="text-xs text-dim">{selectedDuration} minute session</p>
        </div>
        <button
          type="button"
          onClick={stopExercise}
          className="px-3 py-1.5 text-xs font-medium text-sub hover:text-heading bg-elevated border border-edge rounded-lg hover:border-red-500/30 transition-all"
        >
          End
        </button>
      </div>

      {/* Breathing circle */}
      <div className="flex flex-col items-center mb-6">
        <div className="relative w-48 h-48 flex items-center justify-center mb-4">
          {/* Background glow */}
          <div
            className="absolute inset-0 rounded-full blur-2xl transition-all duration-1000"
            style={{
              background: phase === 'inhale' || phase === 'holdIn'
                ? 'radial-gradient(circle, rgba(20, 184, 166, 0.15) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
              transform: `scale(${scale})`,
            }}
          />

          {/* Main circle */}
          <div
            className="w-40 h-40 rounded-full border-2 flex items-center justify-center transition-all duration-1000 ease-in-out"
            style={{
              transform: `scale(${scale})`,
              borderColor: phase === 'inhale' || phase === 'holdIn'
                ? 'rgb(20, 184, 166)'
                : 'rgb(99, 102, 241)',
              backgroundColor: phase === 'inhale' || phase === 'holdIn'
                ? 'rgba(20, 184, 166, 0.08)'
                : 'rgba(99, 102, 241, 0.08)',
            }}
          >
            <div className="text-center">
              <p className={`text-lg font-bold ${getPhaseColour(phase)}`}>
                {phaseTimeLeft}
              </p>
              <p className={`text-xs font-medium ${getPhaseColour(phase)}`}>
                {getPhaseLabel(phase)}
              </p>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-xs">
          <div className="h-1 bg-elevated rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-1000"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[10px] text-dim">
              Cycle {cyclesCompleted + 1}/{totalCycles}
            </span>
            <span className="text-[10px] text-dim">
              {Math.floor((totalSeconds - totalSecondsElapsed) / 60)}:{String((totalSeconds - totalSecondsElapsed) % 60).padStart(2, '0')} left
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
