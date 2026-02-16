'use client';

import { useEffect, useState, useMemo } from 'react';
import { useStrava } from '@/store/useStrava';
import type { StravaActivity, StravaSportType } from '@/lib/strava/types';
import { formatDuration, formatDistance, formatElevation } from '@/lib/strava/types';
import ActivityCard from './components/ActivityCard';
import ActivityDetailModal from './components/ActivityDetailModal';
import SportTypeBadge from './components/SportTypeBadge';
import RouteMap from './components/RouteMap';
import StatCard from '@/components/shared/charts/StatCard';
import HeatmapGrid from '@/components/shared/charts/HeatmapGrid';

type Tab = 'activities' | 'stats' | 'maps';

export default function StravaPage() {
  const {
    connection,
    activities,
    loading,
    syncing,
    error,
    stats,
    sportTypeFilter,
    fetchActivities,
    syncActivities,
    setSportTypeFilter,
  } = useStrava();

  const [activeTab, setActiveTab] = useState<Tab>('activities');
  const [selectedStravaId, setSelectedStravaId] = useState<number | null>(null);
  const [selectedMapActivity, setSelectedMapActivity] = useState<StravaActivity | null>(null);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Build heatmap data from activities
  const heatmapData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const a of activities) {
      const date = a.start_date.slice(0, 10);
      map[date] = (map[date] ?? 0) + 1;
    }
    return map;
  }, [activities]);

  // Unique sport types in activities
  const sportTypes = useMemo(() => {
    const types = new Set<string>();
    for (const a of activities) types.add(a.sport_type);
    return Array.from(types).sort();
  }, [activities]);

  // Activities with polylines for map tab
  const activitiesWithRoutes = useMemo(
    () => activities.filter((a) => a.summary_polyline),
    [activities]
  );

  // Not connected state
  if (!loading && !connection) {
    return (
      <div className="h-full flex flex-col gap-4 overflow-hidden">
        <header className="flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-.842l2.585 5.1 2.585-5.1h-1.725L12 4.8l-3.774 7.33z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-heading">Strava</h1>
              <p className="text-xs text-dim">Running, cycling & more</p>
            </div>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-.842l2.585 5.1 2.585-5.1h-1.725L12 4.8l-3.774 7.33z" />
              </svg>
            </div>
            <h2 className="text-sm font-semibold text-heading mb-1">Connect Your Strava Account</h2>
            <p className="text-xs text-dim mb-4">
              Sync your runs, rides, and workouts to view activity stats, route maps, and performance trends.
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

        {error && (
          <div className="flex-shrink-0 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-.842l2.585 5.1 2.585-5.1h-1.725L12 4.8l-3.774 7.33z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-heading">Strava</h1>
              <p className="text-xs text-dim">
                {connection?.display_name
                  ? `Connected as ${connection.display_name}`
                  : 'Connected'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => syncActivities()}
            disabled={syncing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors disabled:opacity-50"
          >
            <svg className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {syncing ? 'Syncing...' : 'Sync'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-inner rounded-lg">
          {(['activities', 'stats', 'maps'] as Tab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeTab === tab
                  ? 'bg-card text-heading shadow-sm'
                  : 'text-dim hover:text-sub'
              }`}
            >
              {tab === 'activities' ? 'Activities' : tab === 'stats' ? 'Stats' : 'Maps'}
            </button>
          ))}
        </div>
      </header>

      {/* Loading */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Activities Tab */}
          {activeTab === 'activities' && (
            <div className="flex-1 flex flex-col gap-3 overflow-hidden">
              {/* Sport type filter */}
              {sportTypes.length > 1 && (
                <div className="flex-shrink-0 flex items-center gap-1.5 overflow-x-auto pb-1">
                  <button
                    type="button"
                    onClick={() => setSportTypeFilter(null)}
                    className={`px-2.5 py-1 text-[10px] font-medium rounded-full border transition-colors whitespace-nowrap ${
                      !sportTypeFilter
                        ? 'bg-accent/10 text-accent border-accent/30'
                        : 'text-dim border-edge hover:text-sub'
                    }`}
                  >
                    All
                  </button>
                  {sportTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
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
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
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
            </div>
          )}

          {/* Stats Tab */}
          {activeTab === 'stats' && (
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* Summary stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard label="Total Distance" value={formatDistance(stats.totalDistance)} />
                <StatCard label="Total Time" value={formatDuration(stats.totalTime)} />
                <StatCard label="Total Elevation" value={formatElevation(stats.totalElevation)} />
                <StatCard label="Activities" value={stats.activityCount} />
              </div>

              {/* This week / month */}
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="This Week" value={stats.thisWeekCount} />
                <StatCard label="This Month" value={stats.thisMonthCount} />
              </div>

              {/* Activity heatmap */}
              <div className="bg-card border border-edge rounded-xl p-4">
                <p className="text-xs font-semibold text-heading mb-3">Activity Frequency</p>
                <HeatmapGrid
                  data={heatmapData}
                  weeks={26}
                  colour="#fc4c02"
                />
              </div>

              {/* Sport type breakdown */}
              {sportTypes.length > 0 && (
                <div className="bg-card border border-edge rounded-xl p-4">
                  <p className="text-xs font-semibold text-heading mb-3">Activity Breakdown</p>
                  <div className="space-y-2">
                    {sportTypes.map((type) => {
                      const count = activities.filter((a) => a.sport_type === type).length;
                      const totalDist = activities
                        .filter((a) => a.sport_type === type)
                        .reduce((sum, a) => sum + (a.distance_m ?? 0), 0);
                      const pct = stats.activityCount > 0
                        ? Math.round((count / stats.activityCount) * 100)
                        : 0;
                      return (
                        <div key={type} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <SportTypeBadge sportType={type as StravaSportType} />
                            <span className="text-xs text-dim">{count} activities</span>
                          </div>
                          <div className="flex items-center gap-3">
                            {totalDist > 0 && (
                              <span className="text-xs text-sub">{formatDistance(totalDist)}</span>
                            )}
                            <div className="w-16 h-1.5 rounded-full bg-inner overflow-hidden">
                              <div
                                className="h-full rounded-full bg-accent"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Maps Tab */}
          {activeTab === 'maps' && (
            <div className="flex-1 flex gap-3 overflow-hidden">
              {activitiesWithRoutes.length > 0 ? (
                <>
                  {/* Map */}
                  <div className="flex-1 rounded-xl overflow-hidden border border-edge">
                    <RouteMap
                      polyline={
                        selectedMapActivity?.summary_polyline ??
                        activitiesWithRoutes[0]?.summary_polyline ??
                        ''
                      }
                      className="h-full w-full"
                      interactive
                    />
                  </div>

                  {/* Activity list sidebar */}
                  <div className="w-64 flex-shrink-0 overflow-y-auto space-y-1.5">
                    {activitiesWithRoutes.map((activity) => (
                      <button
                        key={activity.strava_id}
                        type="button"
                        onClick={() => setSelectedMapActivity(activity)}
                        className={`w-full text-left p-2.5 rounded-lg border transition-all ${
                          selectedMapActivity?.strava_id === activity.strava_id
                            ? 'bg-accent/10 border-accent/30'
                            : 'bg-card border-edge hover:border-accent/20'
                        }`}
                      >
                        <p className="text-xs font-medium text-heading truncate">{activity.name}</p>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-dim">
                          <span>{new Date(activity.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                          {activity.distance_m > 0 && (
                            <>
                              <span>|</span>
                              <span>{formatDistance(activity.distance_m)}</span>
                            </>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-dim text-sm">No activities with route data</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Error banner */}
      {error && (
        <div className="flex-shrink-0 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-xs text-red-400">{error}</p>
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
