'use client';

import type { GymSession, ExecutionExercise, SessionRating, WorkoutReflection } from '@/lib/fitness/types';

function formatDuration(seconds: number | null): string {
  if (!seconds) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

const RATING_STYLES: Record<SessionRating, string> = {
  strong: 'text-green-400 bg-green-400/10',
  normal: 'text-blue-400 bg-blue-400/10',
  off: 'text-amber-400 bg-amber-400/10',
};

interface Props {
  session: GymSession & { reflection?: WorkoutReflection[] | WorkoutReflection | null };
  open: boolean;
  onClose: () => void;
}

export default function SessionDetailModal({ session, open, onClose }: Props) {
  if (!open) return null;

  const exercises = session.exercises ?? [];
  const date = new Date(session.started_at).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const workoutName = session.template?.name ?? 'Free Session';

  // Reflection can be array (from join) or single object
  const reflection = Array.isArray(session.reflection)
    ? session.reflection[0]
    : session.reflection;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg mx-4 bg-card border border-edge rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-edge flex-shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-heading">{workoutName}</h2>
            <p className="text-xs text-dim mt-0.5">{date}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-inner transition-colors text-sub hover:text-heading"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 px-4 py-3 border-b border-edge flex-shrink-0 text-xs">
          <div>
            <span className="text-dim">Duration</span>
            <p className="text-heading font-medium">{formatDuration(session.total_duration_sec)}</p>
          </div>
          <div>
            <span className="text-dim">Volume</span>
            <p className="text-heading font-medium">
              {session.total_volume_kg ? `${Math.round(session.total_volume_kg).toLocaleString()} kg` : '—'}
            </p>
          </div>
          <div>
            <span className="text-dim">Exercises</span>
            <p className="text-heading font-medium">{exercises.length}</p>
          </div>
          {reflection?.session_rating && (
            <div>
              <span className="text-dim">Rating</span>
              <p className={`font-medium px-1.5 py-0.5 rounded text-[10px] mt-0.5 w-fit ${RATING_STYLES[reflection.session_rating]}`}>
                {reflection.session_rating}
              </p>
            </div>
          )}
        </div>

        {/* Exercise list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {exercises.map((ex: ExecutionExercise) => {
            const sets = ex.sets ?? [];
            return (
              <div
                key={ex.id}
                className={`p-3 rounded-xl border ${
                  ex.was_skipped
                    ? 'bg-inner/50 border-edge/30 opacity-50'
                    : 'bg-inner border-edge/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-heading">
                    {ex.exercise_name}
                    {ex.is_additional && (
                      <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">added</span>
                    )}
                  </p>
                  {ex.was_skipped && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">skipped</span>
                  )}
                </div>

                {sets.length > 0 ? (
                  <div className="space-y-1">
                    {sets.map((s) => (
                      <div key={s.id} className="flex items-center justify-between text-xs">
                        <span className="text-dim">Set {s.set_number}</span>
                        <span className="text-heading font-medium">{s.actual_weight_kg}kg x {s.actual_reps}</span>
                      </div>
                    ))}
                  </div>
                ) : !ex.was_skipped ? (
                  <p className="text-xs text-dim italic">No sets logged</p>
                ) : null}
              </div>
            );
          })}
        </div>

        {/* Reflection note */}
        {reflection?.reflection_note && (
          <div className="px-4 py-3 border-t border-edge flex-shrink-0">
            <p className="text-[10px] text-dim uppercase mb-1">Reflection</p>
            <p className="text-xs text-sub italic">{reflection.reflection_note}</p>
          </div>
        )}
      </div>
    </div>
  );
}
