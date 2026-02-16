'use client';

import type { StravaActivity, StravaSportType } from '@/lib/strava/types';
import {
  formatDuration,
  formatDistance,
  formatPace,
  formatSpeed,
  formatElevation,
  getSportGroup,
  getSportIcon,
  getSportColor,
  getSportLabel,
} from '@/lib/strava/types';

interface Props {
  activity: StravaActivity;
  onClick: () => void;
}

export default function ActivityCard({ activity, onClick }: Props) {
  const group = getSportGroup(activity.sport_type as StravaSportType);
  const isRunOrHike = group === 'run' || group === 'hike';

  const date = new Date(activity.start_date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const dayName = new Date(activity.start_date).toLocaleDateString('en-GB', { weekday: 'short' });
  const time = new Date(activity.start_date).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full p-3 bg-card border border-edge rounded-xl hover:border-accent/30 transition-all text-left group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${getSportColor(activity.sport_type as StravaSportType)}`}>
              {getSportIcon(activity.sport_type as StravaSportType)} {getSportLabel(activity.sport_type as StravaSportType)}
            </span>
            {activity.pr_count > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 font-medium">
                {activity.pr_count} PR{activity.pr_count > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-heading mt-1.5 truncate group-hover:text-accent transition-colors">
            {activity.name}
          </p>
          <div className="flex items-center gap-2 mt-1 text-[11px] text-dim">
            <span>{dayName} {date}</span>
            <span className="text-dim">|</span>
            <span>{time}</span>
          </div>
        </div>
      </div>

      {/* Metrics row */}
      <div className="flex items-center gap-3 mt-2.5 flex-wrap">
        {activity.distance_m > 0 && (
          <MetricChip label="Distance" value={formatDistance(activity.distance_m)} />
        )}
        <MetricChip label="Time" value={formatDuration(activity.moving_time_sec)} />
        {activity.distance_m > 0 && (
          <MetricChip
            label={isRunOrHike ? 'Pace' : 'Speed'}
            value={isRunOrHike ? formatPace(activity.average_speed_mps) : formatSpeed(activity.average_speed_mps)}
          />
        )}
        {activity.total_elevation_gain_m > 0 && (
          <MetricChip label="Elevation" value={formatElevation(activity.total_elevation_gain_m)} />
        )}
        {activity.has_heartrate && activity.average_heartrate && (
          <MetricChip label="Avg HR" value={`${Math.round(activity.average_heartrate)} bpm`} />
        )}
      </div>
    </button>
  );
}

function MetricChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-[10px]">
      <span className="text-dim">{label} </span>
      <span className="text-heading font-medium">{value}</span>
    </div>
  );
}
