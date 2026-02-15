'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGymSession } from '@/store/useGymSession';
import { useFitnessSchedule } from '@/store/useFitnessSchedule';
import { useTimer, formatTime } from '@/hooks/useTimer';
import { createReflection, updateReflection } from '@/lib/fitness/mutations';
import { createClient } from '@/lib/supabase/client';
import type { SessionRating, LogSetInput, ExecutionExercise, GymSession } from '@/lib/fitness/types';

type GymView = 'loading' | 'start' | 'exercise' | 'paused' | 'summary' | 'reflection';

export default function GymModePage() {
  const router = useRouter();
  const store = useGymSession();
  const { todayWorkout, fetchToday } = useFitnessSchedule();
  const [view, setView] = useState<GymView>('loading');
  const [completedSession, setCompletedSession] = useState<GymSession | null>(null);
  const [completedElapsed, setCompletedElapsed] = useState(0);
  useTimer();

  // Helper: transition to summary with a snapshot of the session
  const goToSummary = (session: GymSession | null) => {
    if (!session) return;
    setCompletedSession(session);
    setCompletedElapsed(store.elapsedSeconds);
    setView('summary');
  };

  // Determine view based on store status
  useEffect(() => {
    store.checkForActiveSession().then(() => {
      if (store.status === 'active') setView('exercise');
      else if (store.status === 'paused') setView('paused');
      else if (store.status === 'completed' && store.session) {
        goToSummary(store.session);
      } else {
        fetchToday();
        setView('start');
      }
    });
  }, []);

  // Sync view with status changes
  useEffect(() => {
    if (store.status === 'active' && view === 'paused') setView('exercise');
    if (store.status === 'paused' && view === 'exercise') setView('paused');
    if (store.status === 'completed' && view !== 'reflection' && view !== 'summary') {
      goToSummary(store.session);
    }
  }, [store.status]);

  if (view === 'loading' || store.loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (view === 'start') {
    return <StartScreen todayWorkoutId={todayWorkout?.id} onStart={async (swId) => {
      await store.startSession(swId);
      setView('exercise');
    }} onExit={() => router.push('/fitness')} />;
  }

  if (view === 'paused') {
    return <PauseOverlay
      elapsed={store.elapsedSeconds}
      onResume={async () => { await store.resume(); setView('exercise'); }}
      onEnd={async () => {
        const s = await store.complete();
        goToSummary(s ?? store.session);
      }}
    />;
  }

  if (view === 'summary' && completedSession) {
    return <SessionSummary session={completedSession} elapsed={completedElapsed} onReflect={() => setView('reflection')} />;
  }

  if (view === 'reflection' && completedSession) {
    return <ReflectionScreen sessionId={completedSession.id} onDone={() => { store.reset(); router.push('/fitness'); }} />;
  }

  // Check if any sets have been logged across all exercises
  const exercises = store.session?.exercises ?? [];
  const hasLoggedSets = exercises.some((ex) => (ex.sets ?? []).length > 0);

  const handleChangeMode = async () => {
    await store.abandon();
    store.reset();
    fetchToday();
    setView('start');
  };

  const current = exercises[store.currentExerciseIndex];

  if (!current) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4">
        <p className="text-lg text-sub">No exercises in this session</p>
        <div className="flex flex-col gap-3 w-full max-w-sm">
          <button onClick={handleChangeMode} className="w-full px-6 py-3 bg-white/10 rounded-xl text-heading hover:bg-white/15 transition-colors">
            Change Mode
          </button>
          <button onClick={() => router.push('/fitness')} className="w-full px-6 py-3 text-dim hover:text-heading transition-colors">
            Exit Gym Mode
          </button>
        </div>
      </div>
    );
  }

  return (
    <ExerciseScreen
      exercise={current}
      exerciseIndex={store.currentExerciseIndex}
      totalExercises={exercises.length}
      elapsed={store.elapsedSeconds}
      hasLoggedSets={hasLoggedSets}
      onLogSet={async (input) => { await store.logSet(input); }}
      onNext={() => store.nextExercise()}
      onPrev={() => store.prevExercise()}
      onSkip={async () => { await store.skipExercise(); }}
      onPause={async () => { await store.pause(); setView('paused'); }}
      onFinish={async () => { const s = await store.complete(); goToSummary(s ?? store.session); }}
      onAddExercise={async (name) => { await store.addExercise(name); }}
      onAbandon={async () => { await store.abandon(); store.reset(); router.push('/fitness'); }}
      onChangeMode={handleChangeMode}
    />
  );
}

// ============================================
// START SCREEN
// ============================================
function StartScreen({ todayWorkoutId, onStart, onExit }: { todayWorkoutId?: string; onStart: (swId?: string) => void; onExit: () => void }) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">Gym Mode</h1>
        <p className="text-sub text-lg">Focus. Execute. Log.</p>
      </div>
      <div className="flex flex-col gap-4 w-full max-w-sm">
        {todayWorkoutId && (
          <button
            onClick={() => onStart(todayWorkoutId)}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl text-xl font-bold hover:opacity-90 transition-opacity"
          >
            Start Today&apos;s Workout
          </button>
        )}
        <button
          onClick={() => onStart()}
          className="w-full py-4 bg-white/10 rounded-2xl text-lg font-medium hover:bg-white/15 transition-colors"
        >
          Start Free Session
        </button>
        <button
          onClick={onExit}
          className="w-full py-3 text-dim hover:text-heading transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}

// ============================================
// EXERCISE SCREEN — Single exercise, single set at a time
// ============================================
function ExerciseScreen({
  exercise,
  exerciseIndex,
  totalExercises,
  elapsed,
  hasLoggedSets,
  onLogSet,
  onNext,
  onPrev,
  onSkip,
  onPause,
  onFinish,
  onAddExercise,
  onAbandon,
  onChangeMode,
}: {
  exercise: ExecutionExercise;
  exerciseIndex: number;
  totalExercises: number;
  elapsed: number;
  hasLoggedSets: boolean;
  onLogSet: (input: LogSetInput) => void;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onPause: () => void;
  onFinish: () => void;
  onAddExercise: (name: string) => void;
  onAbandon: () => void;
  onChangeMode: () => void;
}) {
  const sets = exercise.sets ?? [];
  const completedSets = sets.length;
  const targetSets = exercise.target_sets ?? 4;
  const targetReps = exercise.target_reps ?? 10;
  const targetLoad = exercise.target_load_kg;

  // Default weight to last set's weight or target
  const lastWeight = sets.length > 0 ? sets[sets.length - 1].actual_weight_kg : (targetLoad ?? 0);
  const [weight, setWeight] = useState(lastWeight);
  const [reps, setReps] = useState(targetReps);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [newExName, setNewExName] = useState('');
  const [restTimerActive, setRestTimerActive] = useState(false);
  const [restSeconds, setRestSeconds] = useState(0);
  const MAX_SETS = 10;

  // Reset inputs when exercise changes
  useEffect(() => {
    const lw = sets.length > 0 ? sets[sets.length - 1].actual_weight_kg : (targetLoad ?? 0);
    setWeight(lw);
    setReps(targetReps);
    setRestTimerActive(false);
    setRestSeconds(0);
  }, [exercise.id]);

  // Rest timer tick
  useEffect(() => {
    if (!restTimerActive) return;
    const interval = setInterval(() => {
      setRestSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [restTimerActive]);

  const handleLogSet = () => {
    onLogSet({
      execution_exercise_id: exercise.id,
      actual_weight_kg: weight,
      actual_reps: reps,
    });
    // Start rest timer if not at max sets
    if (completedSets + 1 < MAX_SETS) {
      setRestTimerActive(true);
      setRestSeconds(0);
    }
  };

  const dismissRestTimer = () => {
    setRestTimerActive(false);
    setRestSeconds(0);
  };

  return (
    <div className="h-full flex flex-col p-4 md:p-6">
      {/* Top bar: timer + controls */}
      <div className="flex items-center justify-between flex-shrink-0 mb-4">
        <div className="flex items-center gap-3">
          {!hasLoggedSets && (
            <button type="button" onClick={onChangeMode} className="p-3 bg-white/10 rounded-xl hover:bg-white/15 transition-colors" title="Change mode">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <div className="text-2xl font-mono font-bold text-heading/80">{formatTime(elapsed)}</div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onPause} className="p-3 bg-white/10 rounded-xl hover:bg-white/15 transition-colors" title="Pause">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <button onClick={onAbandon} className="p-3 bg-white/10 rounded-xl hover:bg-red-500/20 transition-colors" title="Abandon">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Exercise title */}
      <div className="text-center mb-6 flex-shrink-0">
        <h1 className="text-3xl md:text-4xl font-bold uppercase tracking-wide">{exercise.exercise_name}</h1>
        <p className="text-dim mt-1">Exercise {exerciseIndex + 1} of {totalExercises}</p>
        {exercise.was_skipped && <p className="text-amber-400 text-sm mt-1">Skipped</p>}
      </div>

      {/* Target info */}
      <div className="text-center mb-4 flex-shrink-0">
        <p className="text-sub">
          TARGET: {targetSets} sets × {targetReps} reps
          {targetLoad ? ` @ ${targetLoad}kg` : ''}
        </p>
      </div>

      {/* Completed sets */}
      <div className="flex-shrink-0 mb-6 space-y-2 max-h-48 overflow-y-auto">
        {sets.map((s, i) => (
          <div key={s.id} className="flex items-center justify-between px-4 py-2 bg-white/5 rounded-lg">
            <span className="text-sm text-sub">SET {s.set_number}</span>
            <span className="text-sm font-semibold">{s.actual_weight_kg}kg × {s.actual_reps}</span>
            <span className="text-green-400 text-sm">✓</span>
          </div>
        ))}
        {completedSets < MAX_SETS && !restTimerActive && (
          <div className="flex items-center justify-center px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <span className="text-sm text-blue-400">SET {completedSets + 1} — CURRENT</span>
          </div>
        )}
      </div>

      {/* Weight / Reps input OR Rest Timer */}
      {restTimerActive ? (
        <button
          type="button"
          onClick={dismissRestTimer}
          className="flex-1 w-full flex flex-col items-center justify-center gap-4 cursor-pointer rounded-2xl border-2 border-blue-500/40 bg-blue-500/5 animate-pulse"
        >
          <p className="text-xs text-dim uppercase tracking-wider">Rest Period</p>
          <div className="text-7xl md:text-8xl font-mono font-bold text-blue-400">
            {Math.floor(restSeconds / 60)}:{String(restSeconds % 60).padStart(2, '0')}
          </div>
          <p className="text-lg text-sub mt-2">Tap when ready</p>
        </button>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          <div className="flex items-center gap-8">
            {/* Weight */}
            <div className="flex flex-col items-center gap-2">
              <label className="text-xs text-dim uppercase tracking-wider">Weight (kg)</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setWeight(Math.max(0, weight - 2.5))}
                  className="w-14 h-14 bg-white/10 rounded-xl text-2xl font-bold hover:bg-white/15 transition-colors"
                >
                  −
                </button>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                  aria-label="Weight in kilograms"
                  className="w-24 h-16 bg-white/5 border border-white/10 rounded-xl text-3xl font-bold text-center focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={() => setWeight(weight + 2.5)}
                  className="w-14 h-14 bg-white/10 rounded-xl text-2xl font-bold hover:bg-white/15 transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* Reps */}
            <div className="flex flex-col items-center gap-2">
              <label className="text-xs text-dim uppercase tracking-wider">Reps</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setReps(Math.max(1, reps - 1))}
                  className="w-14 h-14 bg-white/10 rounded-xl text-2xl font-bold hover:bg-white/15 transition-colors"
                >
                  −
                </button>
                <input
                  type="number"
                  value={reps}
                  onChange={(e) => setReps(parseInt(e.target.value) || 1)}
                  aria-label="Number of repetitions"
                  className="w-24 h-16 bg-white/5 border border-white/10 rounded-xl text-3xl font-bold text-center focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={() => setReps(reps + 1)}
                  className="w-14 h-14 bg-white/10 rounded-xl text-2xl font-bold hover:bg-white/15 transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogSet}
            disabled={completedSets >= MAX_SETS}
            className="w-full max-w-md py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl text-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {completedSets >= MAX_SETS ? 'MAX SETS REACHED' : 'LOG SET'}
          </button>
        </div>
      )}

      {/* Bottom nav */}
      <div className="flex-shrink-0 flex items-center justify-between gap-3 mt-4">
        <button
          onClick={onPrev}
          disabled={exerciseIndex === 0}
          className="px-6 py-3 bg-white/10 rounded-xl text-sm font-medium disabled:opacity-30 hover:bg-white/15 transition-colors"
        >
          ← Prev
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={onSkip}
            className="px-5 py-3 bg-amber-500/10 text-amber-400 rounded-xl text-sm font-medium hover:bg-amber-500/20 transition-colors"
          >
            Skip
          </button>
          <button
            onClick={() => setShowAddExercise(true)}
            className="px-5 py-3 bg-white/10 rounded-xl text-sm font-medium hover:bg-white/15 transition-colors"
          >
            + Add
          </button>
        </div>
        <button
          onClick={exerciseIndex < totalExercises - 1 ? onNext : onFinish}
          className="px-6 py-3 bg-white/10 rounded-xl text-sm font-medium hover:bg-white/15 transition-colors"
        >
          {exerciseIndex < totalExercises - 1 ? 'Next →' : 'Finish ✓'}
        </button>
      </div>

      {/* Add Exercise Modal */}
      {showAddExercise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-sm bg-card rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4">Add Exercise</h3>
            <input
              type="text"
              value={newExName}
              onChange={(e) => setNewExName(e.target.value)}
              placeholder="Exercise name"
              className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-heading placeholder:text-dim focus:outline-none focus:border-blue-500 mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button onClick={() => { setShowAddExercise(false); setNewExName(''); }} className="flex-1 py-3 bg-white/10 rounded-xl">Cancel</button>
              <button
                onClick={() => {
                  if (newExName.trim()) {
                    onAddExercise(newExName.trim());
                    setNewExName('');
                    setShowAddExercise(false);
                  }
                }}
                className="flex-1 py-3 bg-blue-600 rounded-xl font-medium"
              >Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// PAUSE OVERLAY
// ============================================
function PauseOverlay({ elapsed, onResume, onEnd }: { elapsed: number; onResume: () => void; onEnd: () => void }) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-8 bg-black/90 p-8">
      <h1 className="text-5xl font-bold text-heading/40">PAUSED</h1>
      <p className="text-3xl font-mono text-heading/60">{formatTime(elapsed)}</p>
      <div className="flex flex-col gap-4 w-full max-w-sm">
        <button onClick={onResume} className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl text-xl font-bold">
          Resume
        </button>
        <button onClick={onEnd} className="w-full py-4 bg-white/10 rounded-2xl text-lg font-medium text-red-400 hover:bg-red-500/10 transition-colors">
          End Session
        </button>
      </div>
    </div>
  );
}

// ============================================
// SESSION SUMMARY — Planned vs Executed
// ============================================
function SessionSummary({ session, elapsed, onReflect }: { session: any; elapsed: number; onReflect: () => void }) {
  const exercises = session?.exercises ?? [];
  let totalVolume = 0;
  let totalSets = 0;
  for (const ex of exercises) {
    for (const set of (ex.sets ?? [])) {
      totalVolume += set.actual_weight_kg * set.actual_reps;
      totalSets++;
    }
  }

  return (
    <div className="h-full flex flex-col items-center justify-center gap-6 p-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Session Complete</h1>
        <p className="text-xl text-sub font-mono">{formatTime(elapsed)}</p>
      </div>

      <div className="grid grid-cols-3 gap-4 w-full max-w-lg">
        <div className="bg-white/5 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-heading">{exercises.length}</p>
          <p className="text-xs text-dim uppercase mt-1">Exercises</p>
        </div>
        <div className="bg-white/5 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-heading">{totalSets}</p>
          <p className="text-xs text-dim uppercase mt-1">Sets</p>
        </div>
        <div className="bg-white/5 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-blue-400">{Math.round(totalVolume).toLocaleString()}</p>
          <p className="text-xs text-dim uppercase mt-1">Volume (kg)</p>
        </div>
      </div>

      {/* Exercise breakdown */}
      <div className="w-full max-w-lg space-y-2 max-h-48 overflow-hidden">
        {exercises.map((ex: ExecutionExercise) => (
          <div key={ex.id} className="flex items-center justify-between px-4 py-2 bg-white/5 rounded-lg">
            <span className="text-sm text-heading">{ex.exercise_name}</span>
            <span className="text-sm text-sub">
              {ex.was_skipped ? (
                <span className="text-amber-400">Skipped</span>
              ) : (
                `${(ex.sets ?? []).length} sets`
              )}
            </span>
          </div>
        ))}
      </div>

      <button
        onClick={onReflect}
        className="w-full max-w-sm py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl text-xl font-bold hover:opacity-90 transition-opacity"
      >
        Add Reflection
      </button>
    </div>
  );
}

// ============================================
// REFLECTION SCREEN — Rating + Note
// ============================================
function ReflectionScreen({ sessionId, onDone }: { sessionId: string; onDone: () => void }) {
  const [rating, setRating] = useState<SessionRating | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      // Create the auto-generated reflection first
      await createReflection(supabase, user.id, sessionId);
      // Then add user input
      if (rating || note) {
        await updateReflection(supabase, sessionId, {
          session_rating: rating ?? undefined,
          reflection_note: note || undefined,
        });
      }
    } catch (err) {
      console.error('Reflection error:', err);
    }
    onDone();
  };

  const ratings: { value: SessionRating; label: string }[] = [
    { value: 'strong', label: 'Strong' },
    { value: 'normal', label: 'Normal' },
    { value: 'off', label: 'Off' },
  ];

  return (
    <div className="h-full flex flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-3xl font-bold">How did it feel?</h1>

      <div className="flex gap-4">
        {ratings.map((r) => (
          <button
            key={r.value}
            onClick={() => setRating(r.value)}
            className={`px-8 py-4 rounded-2xl text-lg font-medium transition-all ${
              rating === r.value
                ? r.value === 'strong' ? 'bg-green-500/20 text-green-400 border-2 border-green-500'
                  : r.value === 'normal' ? 'bg-blue-500/20 text-blue-400 border-2 border-blue-500'
                  : 'bg-red-500/20 text-red-400 border-2 border-red-500'
                : 'bg-white/5 text-sub border-2 border-transparent hover:bg-white/10'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="w-full max-w-md">
        <label className="block text-sm text-dim mb-2">Notes (optional)</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Any thoughts on this session..."
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-heading placeholder:text-dim focus:outline-none focus:border-blue-500 resize-none"
        />
      </div>

      <div className="flex gap-4 w-full max-w-md">
        <button
          onClick={onDone}
          className="flex-1 py-4 bg-white/10 rounded-2xl text-lg font-medium hover:bg-white/15 transition-colors"
        >
          Skip
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl text-lg font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save & Exit'}
        </button>
      </div>
    </div>
  );
}
