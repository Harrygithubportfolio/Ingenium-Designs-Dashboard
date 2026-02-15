'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useFitnessSchedule } from '@/store/useFitnessSchedule';
import TrainingIntentBadge from '@/components/fitness/TrainingIntentBadge';
import WorkoutStatusBadge from '@/components/fitness/WorkoutStatusBadge';
import type { ScheduledWorkout } from '@/lib/fitness/types';

export default function FitnessPage() {
  const { todayWorkout, weekSchedule, templates, loading, refresh } = useFitnessSchedule();

  useEffect(() => {
    refresh();
  }, []);

  const todayTemplate = todayWorkout?.template;
  const exercises = todayTemplate?.exercises ?? [];

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-heading" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-heading">Fitness</h1>
            <p className="text-dim text-[11px]">Train smart, recover well</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/fitness/templates"
            className="px-3 py-1.5 text-xs font-medium text-sub hover:text-heading bg-card border border-edge rounded-lg hover:border-accent/40 transition-all"
          >
            Templates
          </Link>
          <Link
            href="/fitness/schedule"
            className="px-3 py-1.5 text-xs font-medium text-sub hover:text-heading bg-card border border-edge rounded-lg hover:border-accent/40 transition-all"
          >
            Schedule
          </Link>
        </div>
      </header>

      {/* Main Grid */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-hidden">
        {/* Today's Session */}
        <div className="bg-gradient-to-br from-card to-inner rounded-2xl border border-edge p-5 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <h2 className="text-sm font-semibold text-heading">Today&apos;s Session</h2>
            {todayTemplate && <TrainingIntentBadge intent={todayTemplate.training_intent} />}
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            </div>
          ) : todayWorkout && todayTemplate ? (
            <div className="flex-1 flex flex-col min-h-0">
              <h3 className="text-xl font-bold text-heading mb-1">{todayTemplate.name}</h3>
              <p className="text-xs text-dim mb-4">{exercises.length} exercises</p>

              <div className="flex-1 min-h-0 space-y-2 overflow-hidden">
                {exercises.slice(0, 6).map((ex) => (
                  <div key={ex.id} className="flex items-center justify-between py-1.5 px-3 bg-inner rounded-lg">
                    <span className="text-sm text-sub">{ex.exercise_name}</span>
                    <span className="text-xs text-dim">
                      {ex.target_sets}×{ex.target_reps}
                      {ex.target_load_kg ? ` @${ex.target_load_kg}kg` : ''}
                    </span>
                  </div>
                ))}
                {exercises.length > 6 && (
                  <p className="text-xs text-dim text-center">+{exercises.length - 6} more</p>
                )}
              </div>

              <Link
                href="/gym-mode"
                className="mt-4 flex-shrink-0 w-full py-3 bg-gradient-to-r from-accent to-accent-secondary text-white font-semibold rounded-xl text-center hover:opacity-90 transition-opacity"
              >
                Start Gym Mode
              </Link>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <p className="text-sm text-dim">No workout scheduled for today</p>
              <Link
                href="/fitness/schedule"
                className="px-4 py-2 text-xs font-medium text-accent border border-accent/30 rounded-lg hover:bg-accent/10 transition-colors"
              >
                Schedule a Workout
              </Link>
            </div>
          )}
        </div>

        {/* Week Overview + Templates */}
        <div className="flex flex-col gap-4 overflow-hidden">
          {/* Week Overview */}
          <div className="bg-gradient-to-br from-card to-inner rounded-2xl border border-edge p-5 flex-1 min-h-0 flex flex-col overflow-hidden">
            <h2 className="text-sm font-semibold text-heading mb-3 flex-shrink-0">This Week</h2>
            <div className="flex-1 min-h-0 space-y-2 overflow-hidden">
              {weekSchedule.length === 0 ? (
                <p className="text-sm text-dim text-center py-4">No workouts scheduled this week</p>
              ) : (
                weekSchedule.slice(0, 7).map((sw) => (
                  <WeekDayRow key={sw.id} workout={sw} />
                ))
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-gradient-to-br from-card to-inner rounded-2xl border border-edge p-5 flex-shrink-0">
            <h2 className="text-sm font-semibold text-heading mb-3">Quick Stats</h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-inner rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-heading">{templates.length}</p>
                <p className="text-[10px] text-dim uppercase">Templates</p>
              </div>
              <div className="bg-inner rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-green-400">
                  {weekSchedule.filter((w) => w.status === 'completed').length}
                </p>
                <p className="text-[10px] text-dim uppercase">Done</p>
              </div>
              <div className="bg-inner rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-blue-400">
                  {weekSchedule.filter((w) => w.status === 'scheduled').length}
                </p>
                <p className="text-[10px] text-dim uppercase">Upcoming</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WeekDayRow({ workout }: { workout: ScheduledWorkout }) {
  const date = new Date(workout.scheduled_date);
  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const templateName = workout.template?.name ?? 'Unknown';

  return (
    <div className="flex items-center gap-3 py-2 px-3 bg-inner rounded-lg">
      <div className="w-10 text-center flex-shrink-0">
        <p className="text-xs font-semibold text-heading">{dayName}</p>
        <p className="text-[10px] text-dim">{dateStr}</p>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-sub truncate">{templateName}</p>
      </div>
      <WorkoutStatusBadge status={workout.status} />
    </div>
  );
}
