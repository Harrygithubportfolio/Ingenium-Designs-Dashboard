'use client';

import { useState, useEffect, useCallback } from 'react';
import { StatCard } from '@/components/shared/charts';
import type { ReviewSnapshot } from '@/lib/reviews/types';

type Period = 'this_week' | 'last_week' | 'this_month' | 'last_month';

function getPeriodDates(period: Period): { from: string; to: string; type: 'weekly' | 'monthly' } {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  switch (period) {
    case 'this_week': {
      const day = now.getDay();
      const monday = new Date(now);
      monday.setDate(now.getDate() - ((day + 6) % 7));
      return { from: monday.toISOString().slice(0, 10), to: today, type: 'weekly' };
    }
    case 'last_week': {
      const day = now.getDay();
      const thisMonday = new Date(now);
      thisMonday.setDate(now.getDate() - ((day + 6) % 7));
      const lastMonday = new Date(thisMonday);
      lastMonday.setDate(thisMonday.getDate() - 7);
      const lastSunday = new Date(thisMonday);
      lastSunday.setDate(thisMonday.getDate() - 1);
      return { from: lastMonday.toISOString().slice(0, 10), to: lastSunday.toISOString().slice(0, 10), type: 'weekly' };
    }
    case 'this_month': {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: first.toISOString().slice(0, 10), to: today, type: 'monthly' };
    }
    case 'last_month': {
      const firstThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDayPrev = new Date(firstThisMonth);
      lastDayPrev.setDate(0);
      const firstPrev = new Date(lastDayPrev.getFullYear(), lastDayPrev.getMonth(), 1);
      return { from: firstPrev.toISOString().slice(0, 10), to: lastDayPrev.toISOString().slice(0, 10), type: 'monthly' };
    }
  }
}

const PERIOD_LABELS: Record<Period, string> = {
  this_week: 'This Week',
  last_week: 'Last Week',
  this_month: 'This Month',
  last_month: 'Last Month',
};

export default function ReviewsPage() {
  const [period, setPeriod] = useState<Period>('this_week');
  const [review, setReview] = useState<ReviewSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReview = useCallback(async () => {
    setLoading(true);
    const { from, to, type } = getPeriodDates(period);
    try {
      const res = await fetch(`/api/reviews?period=${type}&from=${from}&to=${to}`);
      if (res.ok) {
        const json = await res.json();
        setReview(json.data);
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchReview();
  }, [fetchReview]);

  const m = review?.metrics;

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-heading">Review</h1>
            <p className="text-dim text-[11px]">Your progress at a glance</p>
          </div>
        </div>

        {/* Period selector */}
        <div className="flex items-center gap-1.5">
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                period === p
                  ? 'bg-accent text-white'
                  : 'bg-elevated text-sub hover:text-heading'
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        ) : !m ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-sm text-dim">No data available for this period.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Top Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard
                label="Workouts"
                value={`${m.fitness.workouts_completed}/${m.fitness.workouts_planned}`}
                trend={m.fitness.workout_adherence_pct > 0 ? { direction: m.fitness.workout_adherence_pct >= 80 ? 'up' : 'down', label: `${m.fitness.workout_adherence_pct}% adherence` } : undefined}
              />
              <StatCard
                label="Sleep Avg"
                value={`${m.sleep.avg_hours}h`}
                trend={m.sleep.avg_quality > 0 ? { direction: m.sleep.avg_quality >= 3.5 ? 'up' : 'down', label: `Quality ${m.sleep.avg_quality}/5` } : undefined}
              />
              <StatCard
                label="Hydration"
                value={`${m.hydration.target_hit_days}/${m.hydration.days_logged}`}
                trend={m.hydration.avg_ml > 0 ? { direction: 'flat', label: `Avg ${m.hydration.avg_ml}ml` } : undefined}
              />
              <StatCard
                label="Focus Time"
                value={`${m.focus.total_minutes}m`}
                trend={m.focus.sessions_completed > 0 ? { direction: 'up', label: `${m.focus.sessions_completed} sessions` } : undefined}
              />
            </div>

            {/* Detail Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Fitness */}
              <div className="bg-gradient-to-br from-card to-inner rounded-2xl border border-edge p-5">
                <h3 className="text-sm font-semibold text-heading mb-3">Fitness</h3>
                <div className="space-y-2">
                  <DetailRow label="Workouts planned" value={m.fitness.workouts_planned} />
                  <DetailRow label="Workouts completed" value={m.fitness.workouts_completed} />
                  <DetailRow label="Total volume" value={`${m.fitness.total_volume_kg.toLocaleString()}kg`} />
                  <DetailRow label="Adherence" value={`${m.fitness.workout_adherence_pct}%`} accent />
                </div>
              </div>

              {/* Habits */}
              <div className="bg-gradient-to-br from-card to-inner rounded-2xl border border-edge p-5">
                <h3 className="text-sm font-semibold text-heading mb-3">Habits</h3>
                <div className="space-y-2">
                  <DetailRow label="Total completions" value={m.habits.total_completions} />
                  <DetailRow label="Completion rate" value={`${m.habits.completion_rate_pct}%`} accent />
                  {m.habits.best_streak && (
                    <DetailRow label="Best streak" value={`${m.habits.best_streak.name} (${m.habits.best_streak.days}d)`} />
                  )}
                </div>
              </div>

              {/* Sleep */}
              <div className="bg-gradient-to-br from-card to-inner rounded-2xl border border-edge p-5">
                <h3 className="text-sm font-semibold text-heading mb-3">Sleep</h3>
                <div className="space-y-2">
                  <DetailRow label="Average hours" value={`${m.sleep.avg_hours}h`} />
                  <DetailRow label="Average quality" value={`${m.sleep.avg_quality}/5`} />
                  <DetailRow label="Days logged" value={m.sleep.days_logged} />
                </div>
              </div>

              {/* Goals */}
              <div className="bg-gradient-to-br from-card to-inner rounded-2xl border border-edge p-5">
                <h3 className="text-sm font-semibold text-heading mb-3">Goals</h3>
                <div className="space-y-2">
                  <DetailRow label="Active goals" value={m.goals.active} />
                  <DetailRow label="Completed" value={m.goals.completed} accent />
                </div>
              </div>
            </div>

            {/* AI Summary */}
            {review?.ai_summary && (
              <div className="bg-gradient-to-br from-card to-inner rounded-2xl border border-edge p-5">
                <h3 className="text-sm font-semibold text-heading mb-3">AI Insights</h3>
                <p className="text-sm text-sub leading-relaxed">{review.ai_summary}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DetailRow({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-dim">{label}</span>
      <span className={`text-sm font-bold ${accent ? 'text-accent' : 'text-heading'}`}>{value}</span>
    </div>
  );
}
