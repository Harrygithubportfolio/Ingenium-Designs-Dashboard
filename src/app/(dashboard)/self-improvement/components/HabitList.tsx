'use client';

import { useHabits } from '@/store/useHabits';

export default function HabitList() {
  const { habits, toggleCompletion, loading } = useHabits();
  const today = new Date().toISOString().slice(0, 10);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-24">
        <div className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (habits.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-sub">No habits yet. Add your first one!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {habits.map((habit) => (
        <div
          key={habit.id}
          className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
            habit.completedToday
              ? 'bg-accent/10 border border-accent/20'
              : 'bg-inner border border-edge hover:border-accent/20'
          }`}
        >
          {/* Checkbox */}
          <button
            type="button"
            onClick={() => toggleCompletion(habit.id, today)}
            className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
              habit.completedToday
                ? 'bg-accent text-white'
                : 'bg-elevated border border-edge hover:border-accent/40'
            }`}
            style={!habit.completedToday ? { borderColor: habit.colour + '40' } : undefined}
          >
            {habit.completedToday && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>

          {/* Icon + Name */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {habit.icon && <span className="text-sm">{habit.icon}</span>}
              <span className={`text-sm font-medium ${
                habit.completedToday ? 'text-accent line-through' : 'text-heading'
              }`}>
                {habit.name}
              </span>
              {habit.auto_source && (
                <span className="text-[9px] text-dim bg-elevated px-1.5 py-0.5 rounded">AUTO</span>
              )}
            </div>
            {habit.description && (
              <p className="text-xs text-dim mt-0.5 truncate">{habit.description}</p>
            )}
          </div>

          {/* Streak */}
          <div className="flex flex-col items-end flex-shrink-0">
            <div className="flex items-center gap-1">
              <span className="text-sm font-bold text-heading">{habit.currentStreak}</span>
              <span className="text-[10px] text-dim">day{habit.currentStreak !== 1 ? 's' : ''}</span>
            </div>
            <span className="text-[10px] text-dim">best: {habit.bestStreak}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
