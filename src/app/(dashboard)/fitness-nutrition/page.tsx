'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useFitnessSchedule } from '@/store/useFitnessSchedule';
import { useFitnessProfile } from '@/store/useFitnessProfile';
import { useNutritionDay } from '@/store/useNutritionDay';
import { useStrava } from '@/store/useStrava';
import CalorieRing from '@/components/nutrition/CalorieRing';
import IntakeEventCard from '@/components/nutrition/IntakeEventCard';
import MealDetailModal from '@/components/nutrition/MealDetailModal';
import DailySummaryCard from '@/components/nutrition/DailySummaryCard';
import HistoryTab from '@/components/fitness/history/HistoryTab';
import ActivityCard from '@/app/(dashboard)/strava/components/ActivityCard';
import ActivityDetailModal from '@/app/(dashboard)/strava/components/ActivityDetailModal';
import SportTypeBadge from '@/app/(dashboard)/strava/components/SportTypeBadge';
import StatCard from '@/components/shared/charts/StatCard';
import HeatmapGrid from '@/components/shared/charts/HeatmapGrid';
import FitnessHeroCard from './components/FitnessHeroCard';
import WeeklyOverviewStrip from './components/WeeklyOverviewStrip';
import FitnessStatsGrid from './components/FitnessStatsGrid';
import GamificationBar from './components/GamificationBar';
import FitnessChartsSection from './components/FitnessChartsSection';
import QuickAccessGrid from './components/QuickAccessGrid';
import RecentActivityFeed from './components/RecentActivityFeed';
import type { IntakeEvent } from '@/lib/nutrition/types';
import type { StravaConnection, StravaActivity, StravaSportType } from '@/lib/strava/types';
import { formatDistance, formatDuration, formatElevation } from '@/lib/strava/types';

type Tab = 'fitness' | 'nutrition' | 'history' | 'strava';

export default function FitnessNutritionPage() {
  const [activeTab, setActiveTab] = useState<Tab>('fitness');

  // Fitness store
  const {
    todayWorkout,
    weekSchedule,
    loading: fitnessLoading,
    refresh: refreshFitness,
    monthlyStats,
    heatmapData,
    volumeTrend,
    recentSessions,
    fetchDashboardData,
  } = useFitnessSchedule();

  // Gamification store
  const {
    profile: fitnessProfile,
    achievements: fitnessAchievements,
    prCount,
    loading: profileLoading,
    fetchAll: fetchProfileAll,
  } = useFitnessProfile();

  // Nutrition store
  const {
    events,
    summary,
    loading: nutritionLoading,
    fetchDay,
  } = useNutritionDay();

  // Strava store
  const {
    connection: stravaConnection,
    activities: stravaActivities,
    loading: stravaLoading,
    syncing: stravaSyncing,
    stats: stravaStats,
    sportTypeFilter,
    fetchActivities: fetchStravaActivities,
    syncActivities: syncStravaActivities,
    setSportTypeFilter,
  } = useStrava();

  // Fetch all on mount so tab switching is instant
  useEffect(() => {
    refreshFitness();
    fetchDashboardData();
    fetchProfileAll();
    fetchDay();
    fetchStravaActivities();
  }, []);

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
                  href="/fitness/programmes"
                  className="px-3 py-1.5 text-xs font-medium text-sub hover:text-heading bg-card border border-edge rounded-lg hover:border-purple-500/40 transition-all"
                >
                  Programmes
                </Link>
                <Link
                  href="/fitness/achievements"
                  className="px-3 py-1.5 text-xs font-medium text-sub hover:text-heading bg-card border border-edge rounded-lg hover:border-amber-500/40 transition-all"
                >
                  Achievements
                </Link>
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
            {activeTab === 'strava' && stravaConnection && (
              <>
                <Link
                  href="/strava"
                  className="px-3 py-1.5 text-xs font-medium text-sub hover:text-heading bg-card border border-edge rounded-lg hover:border-[#fc4c02]/40 transition-all"
                >
                  Full View
                </Link>
                <button
                  type="button"
                  onClick={() => syncStravaActivities()}
                  disabled={stravaSyncing}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[#fc4c02]/10 text-[#fc4c02] hover:bg-[#fc4c02]/20 transition-colors disabled:opacity-50"
                >
                  <svg className={`w-3.5 h-3.5 ${stravaSyncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {stravaSyncing ? 'Syncing...' : 'Sync'}
                </button>
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
          <button
            type="button"
            onClick={() => setActiveTab('strava')}
            className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === 'strava'
                ? 'bg-[#fc4c02]/20 text-[#fc4c02] border border-[#fc4c02]/40'
                : 'text-sub hover:text-heading border border-transparent'
            }`}
          >
            Strava
          </button>
        </div>
      </header>

      {/* Tab Content */}
      {activeTab === 'fitness' && (
        <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-y-auto">
          {/* Hero + Weekly Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <FitnessHeroCard todayWorkout={todayWorkout} loading={fitnessLoading} />
            <WeeklyOverviewStrip weekSchedule={weekSchedule} />
          </div>

          {/* Stats Grid */}
          <FitnessStatsGrid
            monthlyWorkouts={monthlyStats?.workoutCount ?? 0}
            streak={fitnessProfile?.current_streak ?? 0}
            monthlyVolume={monthlyStats?.totalVolume ?? 0}
            prCount={prCount}
          />

          {/* Gamification Bar */}
          <GamificationBar
            profile={fitnessProfile}
            achievements={fitnessAchievements}
            loading={profileLoading}
          />

          {/* Charts */}
          <FitnessChartsSection
            volumeTrend={volumeTrend}
            heatmapData={heatmapData}
          />

          {/* Quick Access */}
          <QuickAccessGrid />

          {/* Recent Activity */}
          <RecentActivityFeed sessions={recentSessions} />
        </div>
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
      {activeTab === 'strava' && (
        <StravaTab
          connection={stravaConnection}
          activities={stravaActivities}
          loading={stravaLoading}
          stats={stravaStats}
          sportTypeFilter={sportTypeFilter}
          setSportTypeFilter={setSportTypeFilter}
        />
      )}
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

// ─── Strava Tab ─────────────────────────────────────────────

function StravaTab({
  connection,
  activities,
  loading,
  stats,
  sportTypeFilter,
  setSportTypeFilter,
}: {
  connection: StravaConnection | null;
  activities: StravaActivity[];
  loading: boolean;
  stats: { totalDistance: number; totalTime: number; totalElevation: number; activityCount: number; thisWeekCount: number; thisMonthCount: number };
  sportTypeFilter: string | null;
  setSportTypeFilter: (v: string | null) => void;
}) {
  const [selectedStravaId, setSelectedStravaId] = useState<number | null>(null);

  const sportTypes = useMemo(() => {
    const types = new Set<string>();
    for (const a of activities) types.add(a.sport_type);
    return Array.from(types).sort();
  }, [activities]);

  const heatmapData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const a of activities) {
      const date = a.start_date.slice(0, 10);
      map[date] = (map[date] ?? 0) + 1;
    }
    return map;
  }, [activities]);

  // Not connected
  if (!loading && !connection) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-[#fc4c02]/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#fc4c02]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-.842l2.585 5.1 2.585-5.1h-1.725L12 4.8l-3.774 7.33z" />
            </svg>
          </div>
          <h2 className="text-sm font-semibold text-heading mb-1">Connect Your Strava Account</h2>
          <p className="text-xs text-dim mb-4">
            Sync your runs, rides, and workouts to view activity stats and performance trends.
          </p>
          <a
            href="/api/strava/auth"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-[#fc4c02] text-white hover:bg-[#e34402] transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-.842l2.585 5.1 2.585-5.1h-1.725L12 4.8l-3.774 7.33z" />
            </svg>
            Connect with Strava
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#fc4c02]/30 border-t-[#fc4c02] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-y-auto">
      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 flex-shrink-0">
        <StatCard label="Total Distance" value={formatDistance(stats.totalDistance)} />
        <StatCard label="Total Time" value={formatDuration(stats.totalTime)} />
        <StatCard label="Total Elevation" value={formatElevation(stats.totalElevation)} />
        <StatCard label="Activities" value={stats.activityCount} />
      </div>

      {/* Heatmap */}
      <div className="bg-card border border-edge rounded-xl p-4 flex-shrink-0">
        <p className="text-xs font-semibold text-heading mb-3">Activity Frequency</p>
        <HeatmapGrid data={heatmapData} weeks={20} colour="#fc4c02" />
      </div>

      {/* Sport type filter */}
      {sportTypes.length > 1 && (
        <div className="flex-shrink-0 flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setSportTypeFilter(null)}
            className={`px-2.5 py-1 text-[10px] font-medium rounded-full border transition-colors whitespace-nowrap ${
              !sportTypeFilter
                ? 'bg-[#fc4c02]/10 text-[#fc4c02] border-[#fc4c02]/30'
                : 'text-dim border-edge hover:text-sub'
            }`}
          >
            All
          </button>
          {sportTypes.map((type) => (
            <button
              key={type}
              type="button"
              aria-label={`Filter by ${type}`}
              onClick={() => setSportTypeFilter(sportTypeFilter === type ? null : type)}
              className={`whitespace-nowrap ${
                sportTypeFilter === type ? 'opacity-100' : 'opacity-60 hover:opacity-80'
              }`}
            >
              <SportTypeBadge sportType={type as StravaSportType} />
            </button>
          ))}
        </div>
      )}

      {/* Activity list */}
      {activities.length > 0 ? (
        <div className="space-y-2">
          {activities.map((activity) => (
            <ActivityCard
              key={activity.strava_id}
              activity={activity}
              onClick={() => setSelectedStravaId(activity.strava_id)}
            />
          ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-2">
          <p className="text-dim text-sm">No activities found</p>
          <p className="text-dim text-xs">Click Sync to fetch your Strava activities</p>
        </div>
      )}

      {/* Detail modal */}
      <ActivityDetailModal
        stravaId={selectedStravaId}
        open={selectedStravaId !== null}
        onClose={() => setSelectedStravaId(null)}
      />
    </div>
  );
}
