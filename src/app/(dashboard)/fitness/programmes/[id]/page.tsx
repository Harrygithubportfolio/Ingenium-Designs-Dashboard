'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { TrainingProgramme, ProgrammeExercise } from '@/lib/fitness/programme-types';
import {
  PROGRAMME_GOAL_LABELS,
  PROGRAMME_GOAL_COLORS,
  PROGRAMME_STATUS_LABELS,
  PROGRAMME_STATUS_COLORS,
} from '@/lib/fitness/programme-types';
import { TRAINING_INTENT_COLORS, TRAINING_INTENT_LABELS } from '@/lib/fitness/types';
import type { TrainingIntent } from '@/lib/fitness/types';

export default function ProgrammeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const programmeId = params.id as string;

  const [programme, setProgramme] = useState<TrainingProgramme | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [activating, setActivating] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    // Default to next Monday
    const d = new Date();
    d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7));
    return d.toISOString().split('T')[0];
  });
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/fitness/programmes/${programmeId}`)
      .then((r) => r.json())
      .then((json) => {
        setProgramme(json.data ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [programmeId]);

  const handleActivate = async () => {
    setActivating(true);
    try {
      const res = await fetch(`/api/fitness/programmes/${programmeId}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start_date: startDate }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      // Refresh programme data
      const updated = await fetch(`/api/fitness/programmes/${programmeId}`).then((r) => r.json());
      setProgramme(updated.data);
      setShowActivateModal(false);
    } catch (err) {
      console.error('Activation error:', err);
    }
    setActivating(false);
  };

  const handleAbandon = async () => {
    try {
      await fetch(`/api/fitness/programmes/${programmeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'abandoned' }),
      });
      router.push('/fitness/programmes');
    } catch (err) {
      console.error('Abandon error:', err);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (!programme) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-dim">Programme not found</p>
      </div>
    );
  }

  const plan = programme.ai_generated_plan;
  const weekWorkouts = (programme.workouts ?? []).filter((w) => w.week_number === selectedWeek);
  const totalWeeks = plan?.duration_weeks ?? programme.duration_weeks;
  const goalColors = PROGRAMME_GOAL_COLORS[programme.goal] ?? '';
  const statusColors = PROGRAMME_STATUS_COLORS[programme.status] ?? '';

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/fitness/programmes" className="text-dim hover:text-sub transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-heading">{programme.name}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${goalColors}`}>
                {PROGRAMME_GOAL_LABELS[programme.goal]}
              </span>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusColors}`}>
                {PROGRAMME_STATUS_LABELS[programme.status]}
              </span>
              <span className="text-[10px] text-dim">{totalWeeks} weeks</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {programme.status === 'draft' && (
            <button
              type="button"
              onClick={() => setShowActivateModal(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-accent to-accent-secondary rounded-xl hover:opacity-90 transition-opacity"
            >
              Activate Programme
            </button>
          )}
          {programme.status === 'active' && (
            <button
              type="button"
              onClick={handleAbandon}
              className="px-4 py-2 text-xs font-medium text-red-400 border border-red-400/30 rounded-lg hover:bg-red-400/10 transition-colors"
            >
              Abandon
            </button>
          )}
        </div>
      </header>

      {/* Overview */}
      {plan?.description && (
        <div className="flex-shrink-0 bg-gradient-to-br from-card to-inner rounded-2xl border border-edge p-4">
          <p className="text-xs text-sub">{plan.description}</p>
          {plan.training_split && (
            <p className="text-[10px] text-dim mt-2">
              <span className="text-sub font-medium">Split:</span> {plan.training_split}
            </p>
          )}
          {plan.progression_notes && (
            <p className="text-[10px] text-dim mt-1">
              <span className="text-sub font-medium">Progression:</span> {plan.progression_notes}
            </p>
          )}
        </div>
      )}

      {/* Week selector */}
      <div className="flex-shrink-0 flex items-center gap-1.5 overflow-x-auto pb-1">
        {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((week) => {
          const weekFocus = plan?.weeks?.find((w) => w.week_number === week)?.focus;
          return (
            <button
              key={week}
              type="button"
              onClick={() => setSelectedWeek(week)}
              title={weekFocus ?? undefined}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedWeek === week
                  ? 'bg-accent/20 text-accent border border-accent/40'
                  : 'text-dim border border-transparent hover:text-sub hover:border-edge'
              }`}
            >
              W{week}
            </button>
          );
        })}
      </div>

      {/* Week focus */}
      {plan?.weeks?.find((w) => w.week_number === selectedWeek)?.focus && (
        <p className="flex-shrink-0 text-xs text-dim">
          <span className="text-sub font-medium">Focus:</span>{' '}
          {plan.weeks.find((w) => w.week_number === selectedWeek)!.focus}
        </p>
      )}

      {/* Day cards */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-3">
        {weekWorkouts.length === 0 ? (
          <p className="text-sm text-dim text-center py-8">No workouts for this week</p>
        ) : (
          weekWorkouts.map((workout) => {
            const intentColors = TRAINING_INTENT_COLORS[workout.training_intent as TrainingIntent] ?? '';
            const exercises = (workout.exercises ?? []) as ProgrammeExercise[];

            return (
              <div key={workout.id} className="bg-gradient-to-br from-card to-inner rounded-2xl border border-edge p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-heading">{workout.workout_name}</h3>
                    <p className="text-[10px] text-dim">Day {workout.day_number}</p>
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${intentColors}`}>
                    {TRAINING_INTENT_LABELS[workout.training_intent as TrainingIntent] ?? workout.training_intent}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {exercises.map((ex, idx) => {
                    const exKey = `${workout.id}-${idx}`;
                    const isExpanded = expandedExercise === exKey;

                    return (
                      <button
                        key={exKey}
                        type="button"
                        onClick={() => setExpandedExercise(isExpanded ? null : exKey)}
                        className="w-full text-left"
                      >
                        <div className={`flex items-center justify-between py-2 px-3 rounded-lg transition-colors ${
                          isExpanded ? 'bg-accent/5 border border-accent/20' : 'bg-inner hover:bg-elevated'
                        }`}>
                          <span className="text-sm text-sub">{ex.exercise_name}</span>
                          <span className="text-xs text-dim">
                            {ex.sets} × {ex.reps}
                          </span>
                        </div>
                        {isExpanded && (
                          <div className="mt-1 px-3 py-2 bg-inner rounded-lg space-y-1">
                            <p className="text-[10px] text-dim">
                              <span className="text-sub">Load:</span> {ex.load_suggestion}
                            </p>
                            <p className="text-[10px] text-dim">
                              <span className="text-sub">Rest:</span> {ex.rest_seconds}s
                            </p>
                            {ex.notes && (
                              <p className="text-[10px] text-dim">
                                <span className="text-sub">Notes:</span> {ex.notes}
                              </p>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {workout.notes && (
                  <p className="text-[10px] text-dim mt-2 pt-2 border-t border-edge">
                    {workout.notes}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Activate Modal */}
      {showActivateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-card border border-edge rounded-2xl p-6 max-w-md w-full mx-4 space-y-4">
            <h2 className="text-sm font-semibold text-heading">Activate Programme</h2>
            <p className="text-xs text-dim">
              This will create workout templates and schedule all sessions starting from the date below.
            </p>
            <div>
              <label className="block text-xs text-sub mb-1">Start Date (Monday)</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-inner border border-edge rounded-lg text-heading text-sm focus:border-accent focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowActivateModal(false)}
                className="px-4 py-2 text-xs text-sub hover:text-heading transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleActivate}
                disabled={activating}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-accent to-accent-secondary rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {activating ? 'Activating...' : 'Activate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
