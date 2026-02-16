'use client';

import { useEffect, useState } from 'react';
import type { StravaDetailedActivity, StravaSportType } from '@/lib/strava/types';
import {
  formatDuration,
  formatDistance,
  formatPace,
  formatSpeed,
  formatElevation,
  getSportGroup,
} from '@/lib/strava/types';
import SportTypeBadge from './SportTypeBadge';
import RouteMap from './RouteMap';

interface Props {
  stravaId: number | null;
  open: boolean;
  onClose: () => void;
}

export default function ActivityDetailModal({ stravaId, open, onClose }: Props) {
  const [detail, setDetail] = useState<StravaDetailedActivity | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !stravaId) {
      setDetail(null);
      return;
    }

    setLoading(true);
    fetch(`/api/strava/activities/${stravaId}`)
      .then((res) => res.json())
      .then(({ data }) => setDetail(data))
      .catch((err) => console.error('Activity detail error:', err))
      .finally(() => setLoading(false));
  }, [stravaId, open]);

  if (!open) return null;

  const group = detail ? getSportGroup(detail.sport_type as StravaSportType) : null;
  const isRunOrHike = group === 'run' || group === 'hike';
  const polyline = detail?.full_polyline ?? detail?.summary_polyline;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg mx-4 bg-card border border-edge rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-edge flex-shrink-0">
          <div className="min-w-0 flex-1">
            {detail && (
              <SportTypeBadge sportType={detail.sport_type as StravaSportType} />
            )}
            <h2 className="text-sm font-semibold text-heading mt-1.5 truncate">
              {detail?.name ?? 'Loading...'}
            </h2>
            {detail && (
              <p className="text-xs text-dim mt-0.5">
                {new Date(detail.start_date).toLocaleDateString('en-GB', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
                {' at '}
                {new Date(detail.start_date).toLocaleTimeString('en-GB', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-inner transition-colors text-sub hover:text-heading flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        ) : detail ? (
          <div className="flex-1 overflow-y-auto">
            {/* Route map */}
            {polyline && (
              <RouteMap polyline={polyline} className="h-48 w-full" interactive />
            )}

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-px bg-edge/30 border-b border-edge">
              {detail.distance_m > 0 && (
                <StatCell label="Distance" value={formatDistance(detail.distance_m)} />
              )}
              <StatCell label="Moving Time" value={formatDuration(detail.moving_time_sec)} />
              <StatCell label="Elapsed Time" value={formatDuration(detail.elapsed_time_sec)} />
              {detail.total_elevation_gain_m > 0 && (
                <StatCell label="Elevation" value={formatElevation(detail.total_elevation_gain_m)} />
              )}
              {detail.distance_m > 0 && (
                <StatCell
                  label={isRunOrHike ? 'Avg Pace' : 'Avg Speed'}
                  value={isRunOrHike ? formatPace(detail.average_speed_mps) : formatSpeed(detail.average_speed_mps)}
                />
              )}
              {detail.distance_m > 0 && (
                <StatCell
                  label={isRunOrHike ? 'Max Pace' : 'Max Speed'}
                  value={isRunOrHike ? formatPace(detail.max_speed_mps) : formatSpeed(detail.max_speed_mps)}
                />
              )}
              {detail.has_heartrate && detail.average_heartrate && (
                <StatCell label="Avg HR" value={`${Math.round(detail.average_heartrate)} bpm`} />
              )}
              {detail.has_heartrate && detail.max_heartrate && (
                <StatCell label="Max HR" value={`${Math.round(detail.max_heartrate)} bpm`} />
              )}
              {detail.calories != null && detail.calories > 0 && (
                <StatCell label="Calories" value={`${Math.round(detail.calories)} kcal`} />
              )}
            </div>

            {/* Achievement badges */}
            {(detail.achievement_count > 0 || detail.pr_count > 0) && (
              <div className="flex items-center gap-2 px-4 py-3 border-b border-edge">
                {detail.pr_count > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 font-medium">
                    {detail.pr_count} PR{detail.pr_count > 1 ? 's' : ''}
                  </span>
                )}
                {detail.achievement_count > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20 font-medium">
                    {detail.achievement_count} achievement{detail.achievement_count > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            )}

            {/* Splits table */}
            {detail.splits_metric && detail.splits_metric.length > 0 && (
              <div className="px-4 py-3">
                <p className="text-[10px] text-dim uppercase mb-2 font-semibold tracking-wider">Splits</p>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-dim pb-1 border-b border-edge/30">
                    <span className="w-10">Km</span>
                    <span className="w-16 text-right">Pace</span>
                    <span className="w-14 text-right">Elev</span>
                    {detail.has_heartrate && <span className="w-12 text-right">HR</span>}
                  </div>
                  {detail.splits_metric.map((split) => (
                    <div key={split.split} className="flex items-center justify-between text-xs">
                      <span className="w-10 text-dim">{split.split}</span>
                      <span className="w-16 text-right text-heading font-medium">
                        {formatPace(split.average_speed)}
                      </span>
                      <span className="w-14 text-right text-sub">
                        {split.elevation_difference > 0 ? '+' : ''}{Math.round(split.elevation_difference)}m
                      </span>
                      {detail.has_heartrate && (
                        <span className="w-12 text-right text-sub">
                          {split.average_heartrate ? Math.round(split.average_heartrate) : '—'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {detail.description && (
              <div className="px-4 py-3 border-t border-edge">
                <p className="text-[10px] text-dim uppercase mb-1">Description</p>
                <p className="text-xs text-sub">{detail.description}</p>
              </div>
            )}

            {/* Device info */}
            {detail.device_name && (
              <div className="px-4 py-2 border-t border-edge">
                <p className="text-[10px] text-dim">
                  Recorded with <span className="text-sub">{detail.device_name}</span>
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <p className="text-dim text-sm">Failed to load activity details</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-2.5 bg-card">
      <p className="text-[10px] text-dim">{label}</p>
      <p className="text-sm font-semibold text-heading mt-0.5">{value}</p>
    </div>
  );
}
