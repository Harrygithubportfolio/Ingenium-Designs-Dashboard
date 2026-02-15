'use client';

import WorkoutStatusBadge from '@/components/fitness/WorkoutStatusBadge';
import TrainingIntentBadge from '@/components/fitness/TrainingIntentBadge';
import type { ScheduledWorkout } from '@/lib/fitness/types';

interface Props {
  schedule: ScheduledWorkout[];
  onSelectWorkout: (workout: ScheduledWorkout) => void;
}

export default function AgendaView({ schedule, onSelectWorkout }: Props) {
  if (schedule.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2">
        <p className="text-dim text-sm">No workouts scheduled</p>
        <p className="text-dim text-xs">Tap &quot;+ Schedule&quot; to add one</p>
      </div>
    );
  }

  // Group by date
  const grouped: Record<string, ScheduledWorkout[]> = {};
  for (const w of schedule) {
    if (!grouped[w.scheduled_date]) grouped[w.scheduled_date] = [];
    grouped[w.scheduled_date].push(w);
  }

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="flex-1 overflow-y-auto space-y-4 pr-1">
      {Object.entries(grouped).map(([date, workouts]) => {
        const d = new Date(date + 'T00:00:00');
        const isToday = date === todayStr;
        const isPast = date < todayStr;
        const dateLabel = d.toLocaleDateString('en-GB', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        });

        return (
          <div key={date}>
            {/* Date header */}
            <div className="flex items-center gap-2 mb-2">
              <p className={`text-xs font-semibold ${isToday ? 'text-accent' : isPast ? 'text-dim' : 'text-sub'}`}>
                {isToday ? 'Today' : dateLabel}
              </p>
              {isToday && (
                <span className="text-[10px] text-dim">{dateLabel}</span>
              )}
              <div className="flex-1 h-px bg-edge" />
            </div>

            {/* Workout cards */}
            <div className="space-y-2">
              {workouts.map((w) => {
                const exercises = w.template?.exercises ?? [];
                return (
                  <button
                    type="button"
                    key={w.id}
                    onClick={() => onSelectWorkout(w)}
                    className={`w-full p-4 rounded-xl border text-left transition-all group ${
                      isToday
                        ? 'bg-card border-accent/30 hover:border-accent/50'
                        : 'bg-card border-edge hover:border-accent/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-heading group-hover:text-accent transition-colors truncate">
                          {w.template?.name ?? 'Workout'}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          {w.template && <TrainingIntentBadge intent={w.template.training_intent} />}
                          <WorkoutStatusBadge status={w.status} />
                        </div>
                      </div>
                    </div>

                    {/* Exercise preview */}
                    {exercises.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                        {exercises.slice(0, 3).map((ex) => (
                          <span
                            key={ex.id}
                            className="text-[10px] px-1.5 py-0.5 rounded text-sub border border-edge bg-inner"
                          >
                            {ex.exercise_name}
                          </span>
                        ))}
                        {exercises.length > 3 && (
                          <span className="text-[10px] text-dim">+{exercises.length - 3} more</span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
