'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useFitnessSchedule } from '@/store/useFitnessSchedule';
import { useNutritionDay } from '@/store/useNutritionDay';
import TrainingIntentBadge from '@/components/fitness/TrainingIntentBadge';
import WorkoutStatusBadge from '@/components/fitness/WorkoutStatusBadge';
import CalorieRing from '@/components/nutrition/CalorieRing';
import IntakeEventCard from '@/components/nutrition/IntakeEventCard';
import MealDetailModal from '@/components/nutrition/MealDetailModal';
import DailySummaryCard from '@/components/nutrition/DailySummaryCard';
import HistoryTab from '@/components/fitness/history/HistoryTab';
import type { ScheduledWorkout } from '@/lib/fitness/types';
import type { IntakeEvent } from '@/lib/nutrition/types';

type Tab = 'fitness' | 'nutrition' | 'history';

export default function FitnessNutritionPage() {
  const [activeTab, setActiveTab] = useState<Tab>('fitness');

  // Fitness store
  const {
    todayWorkout,
    weekSchedule,
    templates,
    loading: fitnessLoading,
    refresh: refreshFitness,
  } = useFitnessSchedule();

  // Nutrition store
  const {
    events,
    summary,
    loading: nutritionLoading,
    fetchDay,
  } = useNutritionDay();

  // Fetch both on mount so tab switching is instant
  useEffect(() => {
    refreshFitness();
    fetchDay();
  }, []);

  const todayTemplate = todayWorkout?.template;
  const exercises = todayTemplate?.exercises ?? [];

  const consumed = summary?.consumed ?? { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };
  const targets = summary?.targets ?? { calories: 2400, protein_g: 180, carbs_g: 300, fat_g: 80 };
  const remaining = summary?.remaining ?? { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };
  const calPct = targets.calories > 0 ? Math.round((consumed.calories / targets.calories) * 100) : 0;

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent to-accent-secondary flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-heading" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-heading">Fitness & Nutrition</h1>
              <p className="text-dim text-[11px]">Train smart, eat well</p>
            </div>
          </div>

          {/* Contextual action buttons */}
          <div className="flex items-center gap-2">
            {activeTab === 'fitness' && (
              <>
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
              </>
            )}
            {activeTab === 'nutrition' && (
              <>
                <Link
                  href="/nutrition/targets"
                  className="px-3 py-1.5 text-xs font-medium text-sub hover:text-heading bg-card border border-edge rounded-lg hover:border-accent/40 transition-all"
                >
                  Targets
                </Link>
                <Link
                  href="/nutrition/ai-log"
                  className="px-3 py-1.5 text-xs font-medium text-sub hover:text-heading bg-card border border-edge rounded-lg hover:border-purple-500/40 transition-all"
                >
                  AI Log
                </Link>
                <Link
                  href="/nutrition/log"
                  className="px-4 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-accent to-accent-secondary rounded-lg hover:opacity-90 transition-opacity"
                >
                  + Log Meal
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Tab toggle — always visible on its own row */}
        <div className="flex items-center bg-inner rounded-lg border border-edge p-0.5 w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('fitness')}
            className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === 'fitness'
                ? 'bg-accent/20 text-accent border border-accent/40'
                : 'text-sub hover:text-heading border border-transparent'
            }`}
          >
            Fitness
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('nutrition')}
            className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === 'nutrition'
                ? 'bg-accent/20 text-accent border border-accent/40'
                : 'text-sub hover:text-heading border border-transparent'
            }`}
          >
            Nutrition
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === 'history'
                ? 'bg-accent/20 text-accent border border-accent/40'
                : 'text-sub hover:text-heading border border-transparent'
            }`}
          >
            History
          </button>
        </div>
      </header>

      {/* Tab Content */}
      {activeTab === 'fitness' && (
        <FitnessTab
          loading={fitnessLoading}
          todayWorkout={todayWorkout}
          todayTemplate={todayTemplate}
          exercises={exercises}
          weekSchedule={weekSchedule}
          templatesCount={templates.length}
        />
      )}
      {activeTab === 'nutrition' && (
        <NutritionTab
          loading={nutritionLoading}
          consumed={consumed}
          targets={targets}
          remaining={remaining}
          calPct={calPct}
          events={events}
          onRefresh={fetchDay}
        />
      )}
      {activeTab === 'history' && <HistoryTab />}
    </div>
  );
}

// ─── Fitness Tab ────────────────────────────────────────────

function FitnessTab({
  loading,
  todayWorkout,
  todayTemplate,
  exercises,
  weekSchedule,
  templatesCount,
}: {
  loading: boolean;
  todayWorkout: ScheduledWorkout | null;
  todayTemplate: ScheduledWorkout['template'];
  exercises: NonNullable<NonNullable<ScheduledWorkout['template']>['exercises']>;
  weekSchedule: ScheduledWorkout[];
  templatesCount: number;
}) {
  return (
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
                    {ex.target_sets}&times;{ex.target_reps}
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

      {/* Week Overview + Quick Stats */}
      <div className="flex flex-col gap-4 overflow-hidden">
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

        <div className="bg-gradient-to-br from-card to-inner rounded-2xl border border-edge p-5 flex-shrink-0">
          <h2 className="text-sm font-semibold text-heading mb-3">Quick Stats</h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-inner rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-heading">{templatesCount}</p>
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

// ─── Nutrition Tab ──────────────────────────────────────────

interface MacroTotals {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

function NutritionTab({
  loading,
  consumed,
  targets,
  remaining,
  calPct,
  events,
  onRefresh,
}: {
  loading: boolean;
  consumed: MacroTotals;
  targets: MacroTotals;
  remaining: MacroTotals;
  calPct: number;
  events: IntakeEvent[];
  onRefresh: () => void;
}) {
  const [showRemaining, setShowRemaining] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<IntakeEvent | null>(null);

  return (
    <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-hidden">
      {/* Left: Calorie Ring + Macros */}
      <div className="bg-gradient-to-br from-card to-inner rounded-2xl border border-edge p-5 flex flex-col items-center justify-center gap-4 overflow-hidden">
        {loading ? (
          <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        ) : (
          <>
            <CalorieRing consumed={consumed.calories} target={targets.calories} size={180} />
            <p className="text-sm text-sub">{calPct}% of daily goal</p>

            <button
              type="button"
              onClick={() => setShowRemaining(!showRemaining)}
              className="w-full p-4 bg-inner rounded-xl hover:bg-card transition-colors"
            >
              {showRemaining ? (
                <div>
                  <p className="text-xs text-dim uppercase mb-2">Remaining</p>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-lg font-bold text-blue-400">+{Math.round(remaining.protein_g)}g</p>
                      <p className="text-[10px] text-dim">Protein</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-amber-400">+{Math.round(remaining.carbs_g)}g</p>
                      <p className="text-[10px] text-dim">Carbs</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-red-400">+{Math.round(remaining.fat_g)}g</p>
                      <p className="text-[10px] text-dim">Fat</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-dim mt-2">Tap to see consumed</p>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-dim uppercase mb-2">Consumed</p>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-lg font-bold text-blue-400">{Math.round(consumed.protein_g)}g</p>
                      <p className="text-[10px] text-dim">Protein</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-amber-400">{Math.round(consumed.carbs_g)}g</p>
                      <p className="text-[10px] text-dim">Carbs</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-red-400">{Math.round(consumed.fat_g)}g</p>
                      <p className="text-[10px] text-dim">Fat</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-dim mt-2">Tap to see remaining</p>
                </div>
              )}
            </button>
          </>
        )}
      </div>

      {/* Right: Today's Meals + AI Summary */}
      <div className="bg-gradient-to-br from-card to-inner rounded-2xl border border-edge p-5 flex flex-col overflow-hidden">
        <h2 className="text-sm font-semibold text-heading mb-3 flex-shrink-0">
          Today&apos;s Meals ({events.length})
        </h2>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        ) : events.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <p className="text-sm text-dim">No meals logged today</p>
            <Link
              href="/nutrition/log"
              className="px-4 py-2 text-xs font-medium text-accent border border-accent/30 rounded-lg hover:bg-accent/10 transition-colors"
            >
              Log Your First Meal
            </Link>
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="space-y-2">
              {events.slice(0, 6).map((event) => (
                <IntakeEventCard
                  key={event.id}
                  event={event}
                  onEdit={setSelectedEvent}
                />
              ))}
              {events.length > 6 && (
                <p className="text-xs text-dim text-center">+{events.length - 6} more meals</p>
              )}
            </div>

            {/* AI Summary */}
            <DailySummaryCard
              events={events}
              consumed={consumed}
              targets={targets}
            />
          </div>
        )}
      </div>

      {/* Meal Detail Modal */}
      {selectedEvent && (
        <MealDetailModal
          event={selectedEvent}
          open={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onRefresh={() => {
            onRefresh();
            setSelectedEvent(null);
          }}
        />
      )}
    </div>
  );
}
