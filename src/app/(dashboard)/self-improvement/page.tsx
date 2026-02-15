'use client';

import { useEffect, useState } from 'react';
import { useHabits } from '@/store/useHabits';
import HabitList from './components/HabitList';
import HabitForm from './components/HabitForm';
import HabitHeatmap from './components/HabitHeatmap';

export default function SelfImprovementPage() {
  const { habits, fetchHabits, loading } = useHabits();
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  const completedToday = habits.filter((h) => h.completedToday).length;
  const totalActive = habits.length;
  const completionPct = totalActive > 0 ? Math.round((completedToday / totalActive) * 100) : 0;

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent to-accent-secondary flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-heading">Habits</h1>
            <p className="text-dim text-[11px]">Build consistency, track streaks</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Today's progress */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-card border border-edge rounded-lg">
            <span className="text-xs text-dim">Today:</span>
            <span className="text-sm font-bold text-heading">{completedToday}/{totalActive}</span>
            <span className="text-xs text-accent">({completionPct}%)</span>
          </div>

          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="px-3 py-2 rounded-lg bg-gradient-to-r from-accent to-accent-secondary text-white text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Habit
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left column: Today's habits + form */}
          <div className="lg:col-span-2 space-y-4">
            {showForm && (
              <HabitForm onClose={() => setShowForm(false)} />
            )}

            {/* Today's Habits */}
            <div className="bg-gradient-to-br from-card to-inner rounded-2xl border border-edge p-5">
              <h3 className="text-sm font-semibold text-heading mb-3">Today&apos;s Habits</h3>
              <HabitList />
            </div>

            {/* Heatmap */}
            <div className="bg-gradient-to-br from-card to-inner rounded-2xl border border-edge p-5">
              <HabitHeatmap />
            </div>
          </div>

          {/* Right column: Stats */}
          <div className="space-y-4">
            {/* Top Streaks */}
            <div className="bg-gradient-to-br from-card to-inner rounded-2xl border border-edge p-5">
              <h3 className="text-sm font-semibold text-heading mb-3">Top Streaks</h3>
              {habits.length === 0 ? (
                <p className="text-xs text-dim">No habits yet</p>
              ) : (
                <div className="space-y-2">
                  {habits
                    .filter((h) => h.currentStreak > 0)
                    .sort((a, b) => b.currentStreak - a.currentStreak)
                    .slice(0, 5)
                    .map((habit) => (
                      <div key={habit.id} className="flex items-center gap-3 p-2 rounded-lg bg-inner">
                        <span className="text-sm">{habit.icon || '🔥'}</span>
                        <span className="text-sm text-heading flex-1 truncate">{habit.name}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-bold text-accent">{habit.currentStreak}</span>
                          <span className="text-[10px] text-dim">days</span>
                        </div>
                      </div>
                    ))}
                  {habits.filter((h) => h.currentStreak > 0).length === 0 && (
                    <p className="text-xs text-dim">Complete a habit to start a streak!</p>
                  )}
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="bg-gradient-to-br from-card to-inner rounded-2xl border border-edge p-5">
              <h3 className="text-sm font-semibold text-heading mb-3">Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-dim">Active habits</span>
                  <span className="text-sm font-bold text-heading">{totalActive}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-dim">Completed today</span>
                  <span className="text-sm font-bold text-accent">{completedToday}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-dim">Longest active streak</span>
                  <span className="text-sm font-bold text-heading">
                    {habits.length > 0 ? Math.max(...habits.map((h) => h.currentStreak)) : 0} days
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-dim">All-time best streak</span>
                  <span className="text-sm font-bold text-heading">
                    {habits.length > 0 ? Math.max(...habits.map((h) => h.bestStreak)) : 0} days
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
