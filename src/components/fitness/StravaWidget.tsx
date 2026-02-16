'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useStrava } from '@/store/useStrava';
import type { StravaSportType } from '@/lib/strava/types';
import {
  formatDuration,
  formatDistance,
  getSportIcon,
  getSportLabel,
  getSportColor,
} from '@/lib/strava/types';

export default function StravaWidget() {
  const { connection, activities, loading, fetchActivities } = useStrava();

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Don't render if not connected or loading
  if (loading || !connection) return null;

  const recent = activities.slice(0, 3);

  if (recent.length === 0) return null;

  return (
    <div className="bg-card border border-edge rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#fc4c02]/10 flex items-center justify-center">
            <svg className="w-3 h-3 text-[#fc4c02]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-.842l2.585 5.1 2.585-5.1h-1.725L12 4.8l-3.774 7.33z" />
            </svg>
          </div>
          <p className="text-xs font-semibold text-heading">Recent Strava Activities</p>
        </div>
        <Link
          href="/strava"
          className="text-[10px] font-medium text-accent hover:text-accent-hover transition-colors"
        >
          View all
        </Link>
      </div>

      <div className="space-y-2">
        {recent.map((activity) => (
          <div
            key={activity.strava_id}
            className="flex items-center justify-between p-2.5 rounded-lg bg-inner border border-edge/30"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-sm ${getSportColor(activity.sport_type as StravaSportType).split(' ').slice(0, 1).join(' ')}`}>
                {getSportIcon(activity.sport_type as StravaSportType)}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium text-heading truncate">{activity.name}</p>
                <div className="flex items-center gap-1.5 text-[10px] text-dim">
                  <span>{getSportLabel(activity.sport_type as StravaSportType)}</span>
                  <span>·</span>
                  <span>{new Date(activity.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                </div>
              </div>
            </div>
            <div className="text-right flex-shrink-0 ml-2">
              {activity.distance_m > 0 && (
                <p className="text-xs font-semibold text-heading">{formatDistance(activity.distance_m)}</p>
              )}
              <p className="text-[10px] text-dim">{formatDuration(activity.moving_time_sec)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
