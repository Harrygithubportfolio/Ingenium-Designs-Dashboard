'use client';

import { useState } from 'react';
import { fetchExerciseHistory } from '@/lib/fitness/queries';
import { createClient } from '@/lib/supabase/client';
import ExerciseSearch from './ExerciseSearch';
import ProgressChart from './ProgressChart';

interface ExerciseEntry {
  exercise_name: string;
  gym_session_id: string;
  sets: {
    set_number: number;
    actual_weight_kg: number;
    actual_reps: number;
    logged_at: string;
  }[];
  session: {
    id: string;
    started_at: string;
    status: string;
  };
}

// Supabase !inner join returns session as an array — normalise to single object
function normaliseEntries(raw: unknown[]): ExerciseEntry[] {
  return (raw as Array<Record<string, unknown>>).map((r) => ({
    ...r,
    session: Array.isArray(r.session) ? r.session[0] : r.session,
  })) as ExerciseEntry[];
}

export default function ExercisesView() {
  const [selected, setSelected] = useState<string | null>(null);
  const [entries, setEntries] = useState<ExerciseEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSelect = async (name: string) => {
    if (!name) {
      setSelected(null);
      setEntries([]);
      return;
    }
    setSelected(name);
    setLoading(true);
    try {
      const supabase = createClient();
      const data = await fetchExerciseHistory(supabase, name);
      setEntries(normaliseEntries(data));
    } catch (err) {
      console.error('fetchExerciseHistory error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Build chart data: one point per session, showing max weight
  const chartData = entries
    .filter((e) => e.sets.length > 0)
    .map((entry) => {
      const maxWeight = Math.max(...entry.sets.map((s) => s.actual_weight_kg));
      const bestSet = entry.sets.reduce((a, b) =>
        a.actual_weight_kg > b.actual_weight_kg ? a : b
      );
      const totalVolume = entry.sets.reduce(
        (sum, s) => sum + s.actual_weight_kg * s.actual_reps,
        0
      );
      return {
        date: new Date(entry.session.started_at).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
        }),
        maxWeight,
        totalVolume,
        bestSet: `${bestSet.actual_weight_kg}kg x ${bestSet.actual_reps}`,
      };
    })
    .reverse(); // oldest first for chart

  return (
    <div className="flex-1 flex flex-col gap-4 overflow-hidden">
      <ExerciseSearch onSelect={handleSelect} selected={selected} />

      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-[#3b82f6]/30 border-t-[#3b82f6] rounded-full animate-spin" />
        </div>
      )}

      {!loading && !selected && (
        <div className="flex-1 flex flex-col items-center justify-center gap-2">
          <p className="text-gray-500 text-sm">Search for an exercise above</p>
          <p className="text-gray-600 text-xs">See your weight progression and past performances</p>
        </div>
      )}

      {!loading && selected && entries.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center gap-2">
          <p className="text-gray-500 text-sm">No history for &quot;{selected}&quot;</p>
          <p className="text-gray-600 text-xs">Complete a session with this exercise to see data here</p>
        </div>
      )}

      {!loading && selected && entries.length > 0 && (
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Progress chart */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Weight Progression</p>
            <ProgressChart data={chartData} />
          </div>

          {/* Stats summary */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 bg-[#14141a] rounded-lg border border-[#2a2a33] text-center">
              <p className="text-lg font-bold text-white">
                {chartData.length > 0 ? Math.max(...chartData.map((d) => d.maxWeight)) : 0}kg
              </p>
              <p className="text-[10px] text-gray-500 uppercase">Best Weight</p>
            </div>
            <div className="p-2 bg-[#14141a] rounded-lg border border-[#2a2a33] text-center">
              <p className="text-lg font-bold text-white">{entries.length}</p>
              <p className="text-[10px] text-gray-500 uppercase">Sessions</p>
            </div>
            <div className="p-2 bg-[#14141a] rounded-lg border border-[#2a2a33] text-center">
              <p className="text-lg font-bold text-white">
                {entries.reduce((sum, e) => sum + e.sets.length, 0)}
              </p>
              <p className="text-[10px] text-gray-500 uppercase">Total Sets</p>
            </div>
          </div>

          {/* Past performances */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Past Performances</p>
            <div className="space-y-2">
              {entries.map((entry) => {
                const date = new Date(entry.session.started_at).toLocaleDateString('en-GB', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });
                return (
                  <div
                    key={entry.gym_session_id}
                    className="p-3 bg-[#1a1a22] border border-[#2a2a33] rounded-xl"
                  >
                    <p className="text-xs text-gray-500 mb-2">{date}</p>
                    <div className="space-y-1">
                      {entry.sets
                        .sort((a, b) => a.set_number - b.set_number)
                        .map((s, i) => (
                          <div
                            key={`${entry.gym_session_id}-${i}`}
                            className="flex items-center justify-between text-xs"
                          >
                            <span className="text-gray-500">Set {s.set_number}</span>
                            <span className="text-white font-medium">
                              {s.actual_weight_kg}kg x {s.actual_reps}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
