// ── Strava Connection ──

export interface StravaConnection {
  id: string;
  user_id: string;
  strava_athlete_id: string | null;
  display_name: string | null;
  profile_picture: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ── Strava Activity ──

export interface StravaActivity {
  id: string;
  user_id: string;
  strava_id: number;
  name: string;
  sport_type: StravaSportType;
  start_date: string;
  distance_m: number;
  moving_time_sec: number;
  elapsed_time_sec: number;
  total_elevation_gain_m: number;
  average_speed_mps: number;
  max_speed_mps: number;
  has_heartrate: boolean;
  average_heartrate: number | null;
  max_heartrate: number | null;
  calories: number | null;
  summary_polyline: string | null;
  achievement_count: number;
  pr_count: number;
  synced_at: string;
}

// ── Detailed Activity (from GET /activities/{id}) ──

export interface StravaDetailedActivity extends StravaActivity {
  description: string | null;
  full_polyline: string | null;
  elev_high: number | null;
  elev_low: number | null;
  device_name: string | null;
  splits_metric: StravaSplit[] | null;
}

export interface StravaSplit {
  distance: number;
  elapsed_time: number;
  moving_time: number;
  average_speed: number;
  elevation_difference: number;
  split: number;
  average_heartrate?: number;
  pace_zone?: number;
}

// ── Sport Types ──

export type StravaSportType =
  | 'AlpineSki' | 'BackcountrySki' | 'Badminton' | 'Canoeing'
  | 'Crossfit' | 'EBikeRide' | 'Elliptical' | 'EMountainBikeRide'
  | 'Golf' | 'GravelRide' | 'Handcycle' | 'HighIntensityIntervalTraining'
  | 'Hike' | 'IceSkate' | 'InlineSkate' | 'Kayaking'
  | 'Kitesurf' | 'MountainBikeRide' | 'NordicSki' | 'Pickleball'
  | 'Pilates' | 'Racquetball' | 'Ride' | 'RockClimbing'
  | 'RollerSki' | 'Rowing' | 'Run' | 'Sail'
  | 'Skateboard' | 'Snowboard' | 'Snowshoe' | 'Soccer'
  | 'Squash' | 'StairStepper' | 'StandUpPaddling' | 'Surfing'
  | 'Swim' | 'TableTennis' | 'Tennis' | 'TrailRun'
  | 'Velomobile' | 'VirtualRide' | 'VirtualRow' | 'VirtualRun'
  | 'Walk' | 'WeightTraining' | 'Wheelchair' | 'Windsurf'
  | 'Workout' | 'Yoga';

// ── Display Maps ──

type SportGroup = 'run' | 'ride' | 'swim' | 'hike' | 'winter' | 'water' | 'gym' | 'other';

const SPORT_GROUPS: Record<StravaSportType, SportGroup> = {
  Run: 'run', TrailRun: 'run', VirtualRun: 'run',
  Ride: 'ride', MountainBikeRide: 'ride', GravelRide: 'ride', EBikeRide: 'ride',
  EMountainBikeRide: 'ride', VirtualRide: 'ride', Velomobile: 'ride', Handcycle: 'ride',
  Swim: 'swim',
  Hike: 'hike', Walk: 'hike', Snowshoe: 'hike',
  AlpineSki: 'winter', BackcountrySki: 'winter', NordicSki: 'winter',
  Snowboard: 'winter', IceSkate: 'winter', RollerSki: 'winter',
  Canoeing: 'water', Kayaking: 'water', Rowing: 'water', VirtualRow: 'water',
  Sail: 'water', StandUpPaddling: 'water', Surfing: 'water', Kitesurf: 'water', Windsurf: 'water',
  Crossfit: 'gym', Elliptical: 'gym', StairStepper: 'gym', WeightTraining: 'gym',
  Yoga: 'gym', Pilates: 'gym', HighIntensityIntervalTraining: 'gym', Workout: 'gym',
  Badminton: 'other', Golf: 'other', InlineSkate: 'other', Pickleball: 'other',
  Racquetball: 'other', RockClimbing: 'other', Skateboard: 'other', Soccer: 'other',
  Squash: 'other', TableTennis: 'other', Tennis: 'other', Wheelchair: 'other',
};

const GROUP_COLORS: Record<SportGroup, string> = {
  run:    'bg-orange-500/15 text-orange-400 border-orange-500/30',
  ride:   'bg-green-500/15 text-green-400 border-green-500/30',
  swim:   'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  hike:   'bg-amber-500/15 text-amber-400 border-amber-500/30',
  winter: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  water:  'bg-blue-500/15 text-blue-400 border-blue-500/30',
  gym:    'bg-purple-500/15 text-purple-400 border-purple-500/30',
  other:  'bg-slate-500/15 text-slate-400 border-slate-500/30',
};

const GROUP_ICONS: Record<SportGroup, string> = {
  run:    '🏃',
  ride:   '🚴',
  swim:   '🏊',
  hike:   '🥾',
  winter: '⛷️',
  water:  '🚣',
  gym:    '🏋️',
  other:  '🏅',
};

export function getSportGroup(type: StravaSportType): SportGroup {
  return SPORT_GROUPS[type] ?? 'other';
}

export function getSportColor(type: StravaSportType): string {
  return GROUP_COLORS[getSportGroup(type)];
}

export function getSportIcon(type: StravaSportType): string {
  return GROUP_ICONS[getSportGroup(type)];
}

export function getSportLabel(type: StravaSportType): string {
  // Convert PascalCase to spaced string (e.g., "MountainBikeRide" → "Mountain Bike Ride")
  return type.replace(/([a-z])([A-Z])/g, '$1 $2');
}

// ── Formatting Helpers ──

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function formatDistance(metres: number): string {
  if (metres >= 1000) return `${(metres / 1000).toFixed(2)} km`;
  return `${Math.round(metres)} m`;
}

export function formatPace(speedMps: number): string {
  if (speedMps <= 0) return '--';
  const paceSecsPerKm = 1000 / speedMps;
  const mins = Math.floor(paceSecsPerKm / 60);
  const secs = Math.round(paceSecsPerKm % 60);
  return `${mins}:${secs.toString().padStart(2, '0')} /km`;
}

export function formatSpeed(speedMps: number): string {
  if (speedMps <= 0) return '--';
  return `${(speedMps * 3.6).toFixed(1)} km/h`;
}

export function formatElevation(metres: number): string {
  return `${Math.round(metres)} m`;
}
