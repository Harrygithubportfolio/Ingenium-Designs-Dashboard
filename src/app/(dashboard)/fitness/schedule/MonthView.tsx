'use client';

import type { ScheduledWorkout } from '@/lib/fitness/types';

const INTENT_DOT_COLORS: Record<string, string> = {
  strength: 'bg-red-400',
  hypertrophy: 'bg-purple-400',
  recovery: 'bg-green-400',
  conditioning: 'bg-amber-400',
};

const STATUS_RING: Record<string, string> = {
  completed: 'ring-1 ring-green-400/40',
  missed: 'ring-1 ring-red-400/40',
  rescheduled: 'ring-1 ring-amber-400/40',
};

interface Props {
  year: number;
  month: number;
  schedule: ScheduledWorkout[];
  onSelectDate: (date: string) => void;
  selectedDate: string | null;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  // Adjust to start on Monday (0=Mon, 6=Sun)
  let startOffset = firstDay.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: { date: Date; dateStr: string; inMonth: boolean }[] = [];

  // Previous month padding
  for (let i = startOffset - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    days.push({ date: d, dateStr: d.toISOString().split('T')[0], inMonth: false });
  }

  // Current month
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, month, i);
    days.push({ date: d, dateStr: d.toISOString().split('T')[0], inMonth: true });
  }

  // Next month padding to complete grid
  const remaining = 7 - (days.length % 7);
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({ date: d, dateStr: d.toISOString().split('T')[0], inMonth: false });
    }
  }

  return days;
}

export default function MonthView({ year, month, schedule, onSelectDate, selectedDate, onPrevMonth, onNextMonth }: Props) {
  const days = getMonthDays(year, month);
  const todayStr = new Date().toISOString().split('T')[0];
  const monthLabel = new Date(year, month).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  // Build lookup: date -> workouts
  const workoutsByDate: Record<string, ScheduledWorkout[]> = {};
  for (const w of schedule) {
    if (!workoutsByDate[w.scheduled_date]) workoutsByDate[w.scheduled_date] = [];
    workoutsByDate[w.scheduled_date].push(w);
  }

  // Get selected day's workouts
  const selectedWorkouts = selectedDate ? (workoutsByDate[selectedDate] ?? []) : [];

  return (
    <div className="flex-1 flex flex-col gap-3 overflow-hidden">
      {/* Month navigation */}
      <div className="flex items-center justify-between flex-shrink-0">
        <button
          type="button"
          onClick={onPrevMonth}
          className="p-2 text-sub hover:text-heading hover:bg-card rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <p className="text-sm font-medium text-heading">{monthLabel}</p>
        <button
          type="button"
          onClick={onNextMonth}
          className="p-2 text-sub hover:text-heading hover:bg-card rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day name headers */}
      <div className="grid grid-cols-7 gap-1 flex-shrink-0">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <div key={d} className="text-center text-[10px] text-dim font-medium py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 flex-shrink-0">
        {days.map((day) => {
          const workouts = workoutsByDate[day.dateStr] ?? [];
          const isToday = day.dateStr === todayStr;
          const isSelected = day.dateStr === selectedDate;
          const hasWorkouts = workouts.length > 0;

          return (
            <button
              type="button"
              key={day.dateStr}
              onClick={() => hasWorkouts && onSelectDate(day.dateStr === selectedDate ? '' : day.dateStr)}
              className={`relative p-1.5 rounded-lg text-center transition-all min-h-[42px] ${
                !day.inMonth ? 'opacity-30' : ''
              } ${
                isSelected
                  ? 'bg-accent/15 border border-accent/40'
                  : isToday
                    ? 'bg-accent/5 border border-accent/20'
                    : hasWorkouts
                      ? 'hover:bg-card border border-transparent cursor-pointer'
                      : 'border border-transparent cursor-default'
              }`}
            >
              <p className={`text-xs font-medium ${
                isToday ? 'text-accent' : day.inMonth ? 'text-sub' : 'text-dim'
              }`}>
                {day.date.getDate()}
              </p>
              {hasWorkouts && (
                <div className="flex items-center justify-center gap-0.5 mt-0.5">
                  {workouts.slice(0, 3).map((w) => (
                    <div
                      key={w.id}
                      className={`w-1.5 h-1.5 rounded-full ${
                        INTENT_DOT_COLORS[w.template?.training_intent ?? ''] ?? 'bg-blue-400'
                      } ${STATUS_RING[w.status] ?? ''}`}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected date detail panel */}
      {selectedDate && selectedWorkouts.length > 0 && (
        <div className="flex-1 overflow-y-auto space-y-2 border-t border-edge pt-3">
          <p className="text-xs text-dim font-medium">
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-GB', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </p>
          {selectedWorkouts.map((w) => {
            const exercises = w.template?.exercises ?? [];
            return (
              <div
                key={w.id}
                className="p-3 bg-card border border-edge rounded-xl"
              >
                <p className="text-sm font-medium text-heading">{w.template?.name ?? 'Workout'}</p>
                <div className="flex items-center gap-2 mt-1">
                  {w.template && (
                    <span className="text-[10px] text-dim">{w.template.training_intent}</span>
                  )}
                  <span className="text-[10px] text-dim">|</span>
                  <span className="text-[10px] text-dim">{exercises.length} exercises</span>
                </div>
                {exercises.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {exercises.slice(0, 4).map((ex) => (
                      <p key={ex.id} className="text-[11px] text-sub">
                        {ex.exercise_name} — {ex.target_sets}x{ex.target_reps}
                        {ex.target_load_kg ? ` @${ex.target_load_kg}kg` : ''}
                      </p>
                    ))}
                    {exercises.length > 4 && (
                      <p className="text-[10px] text-dim">+{exercises.length - 4} more</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
