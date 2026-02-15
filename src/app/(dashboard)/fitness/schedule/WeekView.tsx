'use client';

import WorkoutStatusBadge from '@/components/fitness/WorkoutStatusBadge';
import TrainingIntentBadge from '@/components/fitness/TrainingIntentBadge';
import type { ScheduledWorkout } from '@/lib/fitness/types';

interface Props {
  weekStart: Date;
  schedule: ScheduledWorkout[];
  onSelectWorkout: (workout: ScheduledWorkout) => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
}

function getWeekDays(start: Date) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return {
      dateStr: d.toISOString().split('T')[0],
      dayName: d.toLocaleDateString('en-GB', { weekday: 'short' }),
      dateNum: d.getDate(),
      monthStr: d.toLocaleDateString('en-GB', { month: 'short' }),
    };
  });
}

function getWeekLabel(start: Date) {
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const startStr = start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const endStr = end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  return `${startStr} – ${endStr}`;
}

export default function WeekView({ weekStart, schedule, onSelectWorkout, onPrevWeek, onNextWeek }: Props) {
  const days = getWeekDays(weekStart);
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="flex-1 flex flex-col gap-3 overflow-hidden">
      {/* Week navigation */}
      <div className="flex items-center justify-between flex-shrink-0">
        <button
          type="button"
          onClick={onPrevWeek}
          className="p-2 text-gray-400 hover:text-white hover:bg-[#1a1a22] rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <p className="text-sm font-medium text-white">{getWeekLabel(weekStart)}</p>
        <button
          type="button"
          onClick={onNextWeek}
          className="p-2 text-gray-400 hover:text-white hover:bg-[#1a1a22] rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day cards grid */}
      <div className="flex-1 min-h-0 grid grid-cols-2 lg:grid-cols-7 gap-2 overflow-y-auto">
        {days.map((day) => {
          const dayWorkouts = schedule.filter((w) => w.scheduled_date === day.dateStr);
          const isToday = day.dateStr === todayStr;

          return (
            <div
              key={day.dateStr}
              className={`flex flex-col rounded-xl border p-3 min-h-[120px] ${
                isToday
                  ? 'border-[#3b82f6]/40 bg-[#3b82f6]/5'
                  : 'border-[#2a2a33] bg-[#1a1a22]'
              }`}
            >
              {/* Day header */}
              <div className="text-center mb-2 flex-shrink-0">
                <p className={`text-xs font-semibold ${isToday ? 'text-[#3b82f6]' : 'text-gray-400'}`}>
                  {day.dayName}
                </p>
                <p className={`text-lg font-bold ${isToday ? 'text-white' : 'text-gray-300'}`}>
                  {day.dateNum}
                </p>
                <p className="text-[10px] text-gray-600">{day.monthStr}</p>
              </div>

              {/* Workout cards */}
              <div className="flex-1 space-y-1.5">
                {dayWorkouts.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <span className="text-[10px] text-gray-600">Rest</span>
                  </div>
                ) : (
                  dayWorkouts.map((w) => (
                    <button
                      type="button"
                      key={w.id}
                      onClick={() => onSelectWorkout(w)}
                      className="w-full p-2 bg-[#14141a] rounded-lg text-left hover:bg-[#22222c] border border-transparent hover:border-[#3b82f6]/30 transition-all cursor-pointer group"
                    >
                      <p className="text-[11px] font-medium text-white truncate group-hover:text-[#3b82f6] transition-colors">
                        {w.template?.name ?? 'Workout'}
                      </p>
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        {w.template && <TrainingIntentBadge intent={w.template.training_intent} />}
                        <WorkoutStatusBadge status={w.status} />
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
