'use client';

import { useEffect, useState } from 'react';
import { fetchWorkoutHistory } from '@/lib/fitness/queries';
import { createClient } from '@/lib/supabase/client';
import type { GymSession, SessionRating, WorkoutReflection } from '@/lib/fitness/types';
import SessionDetailModal from './SessionDetailModal';

type SessionWithReflection = GymSession & { reflection?: WorkoutReflection[] | WorkoutReflection | null };

function formatDuration(seconds: number | null): string {
  if (!seconds) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

const RATING_STYLES: Record<SessionRating, { bg: string; text: string; label: string }> = {
  strong: { bg: 'bg-green-400/10', text: 'text-green-400', label: 'Strong' },
  normal: { bg: 'bg-blue-400/10', text: 'text-blue-400', label: 'Normal' },
  off: { bg: 'bg-amber-400/10', text: 'text-amber-400', label: 'Off' },
};

export default function SessionsView() {
  const [sessions, setSessions] = useState<SessionWithReflection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<SessionWithReflection | null>(null);

  useEffect(() => {
    setLoading(true);
    const supabase = createClient();
    fetchWorkoutHistory(supabase, undefined, undefined, 50)
      .then((data) => setSessions(data as SessionWithReflection[]))
      .catch((err) => console.error('fetchWorkoutHistory error:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#3b82f6]/30 border-t-[#3b82f6] rounded-full animate-spin" />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2">
        <p className="text-gray-500 text-sm">No workout history yet</p>
        <p className="text-gray-600 text-xs">Complete a gym session to see it here</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {sessions.map((session) => {
          const date = new Date(session.started_at).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          });
          const dayName = new Date(session.started_at).toLocaleDateString('en-GB', { weekday: 'short' });
          const workoutName = session.template?.name ?? 'Free Session';
          const exerciseCount = session.exercises?.length ?? 0;
          const reflection = Array.isArray(session.reflection)
            ? session.reflection[0]
            : session.reflection;
          const rating = reflection?.session_rating;

          return (
            <button
              key={session.id}
              type="button"
              onClick={() => setSelected(session)}
              className="w-full p-3 bg-[#1a1a22] border border-[#2a2a33] rounded-xl hover:border-[#3b82f6]/30 transition-all text-left group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate group-hover:text-[#3b82f6] transition-colors">
                    {workoutName}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-500">
                    <span>{dayName} {date}</span>
                    <span className="text-gray-700">|</span>
                    <span>{formatDuration(session.total_duration_sec)}</span>
                    <span className="text-gray-700">|</span>
                    <span>{exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {session.total_volume_kg && (
                    <span className="text-xs font-semibold text-white">
                      {Math.round(session.total_volume_kg).toLocaleString()} kg
                    </span>
                  )}
                  {rating && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${RATING_STYLES[rating].bg} ${RATING_STYLES[rating].text}`}>
                      {RATING_STYLES[rating].label}
                    </span>
                  )}
                </div>
              </div>

              {/* Exercise preview */}
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                {(session.exercises ?? []).slice(0, 4).map((ex) => (
                  <span
                    key={ex.id}
                    className={`text-[10px] px-1.5 py-0.5 rounded border ${
                      ex.was_skipped
                        ? 'text-gray-600 border-[#2a2a33]/50 line-through'
                        : 'text-gray-400 border-[#2a2a33] bg-[#14141a]'
                    }`}
                  >
                    {ex.exercise_name}
                  </span>
                ))}
                {(session.exercises ?? []).length > 4 && (
                  <span className="text-[10px] text-gray-600">
                    +{(session.exercises ?? []).length - 4} more
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <SessionDetailModal
        session={selected!}
        open={selected !== null}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
