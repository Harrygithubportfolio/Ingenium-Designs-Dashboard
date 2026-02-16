import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stravaFetch } from '@/lib/strava/api';

/**
 * POST /api/strava/sync
 * Fetches activities from Strava and upserts into strava_activities.
 * Query params:
 *   ?full=true  — paginated full sync (up to 200 activities)
 *   (default)   — incremental sync (last 30 activities)
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
      { status: 401 }
    );
  }

  const full = request.nextUrl.searchParams.get('full') === 'true';

  try {
    const allActivities: StravaApiActivity[] = [];

    if (full) {
      // Paginated full sync — up to 200 activities (4 pages of 50)
      for (let page = 1; page <= 4; page++) {
        const res = await stravaFetch(
          user.id, supabase,
          `/athlete/activities?per_page=50&page=${page}`
        );
        if (!res.ok) {
          if (res.status === 429) break; // Rate limited — stop
          throw new Error(`Strava API error: ${res.status}`);
        }
        const activities: StravaApiActivity[] = await res.json();
        if (activities.length === 0) break;
        allActivities.push(...activities);
      }
    } else {
      // Incremental sync — last 30
      const res = await stravaFetch(
        user.id, supabase,
        '/athlete/activities?per_page=30&page=1'
      );
      if (!res.ok) {
        throw new Error(`Strava API error: ${res.status}`);
      }
      const activities: StravaApiActivity[] = await res.json();
      allActivities.push(...activities);
    }

    // Upsert into database
    if (allActivities.length > 0) {
      const rows = allActivities.map((a) => ({
        user_id: user.id,
        strava_id: a.id,
        name: a.name,
        sport_type: a.sport_type,
        start_date: a.start_date,
        distance_m: a.distance,
        moving_time_sec: a.moving_time,
        elapsed_time_sec: a.elapsed_time,
        total_elevation_gain_m: a.total_elevation_gain,
        average_speed_mps: a.average_speed,
        max_speed_mps: a.max_speed,
        has_heartrate: a.has_heartrate ?? false,
        average_heartrate: a.average_heartrate ?? null,
        max_heartrate: a.max_heartrate ?? null,
        calories: null, // Only available on detailed endpoint
        summary_polyline: a.map?.summary_polyline ?? null,
        achievement_count: a.achievement_count ?? 0,
        pr_count: a.pr_count ?? 0,
        synced_at: new Date().toISOString(),
      }));

      const { error: upsertError } = await supabase
        .from('strava_activities')
        .upsert(rows, { onConflict: 'strava_id' });

      if (upsertError) {
        console.error('Strava activities upsert error:', upsertError);
        throw new Error(upsertError.message);
      }
    }

    return NextResponse.json({
      data: { synced: allActivities.length },
      error: null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Strava sync error:', message);
    return NextResponse.json(
      { data: null, error: { code: 'SYNC_ERROR', message } },
      { status: 500 }
    );
  }
}

// Strava API response shape (summary activity)
interface StravaApiActivity {
  id: number;
  name: string;
  sport_type: string;
  start_date: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  average_speed: number;
  max_speed: number;
  has_heartrate?: boolean;
  average_heartrate?: number;
  max_heartrate?: number;
  achievement_count?: number;
  pr_count?: number;
  map?: {
    summary_polyline?: string;
    polyline?: string;
  };
}
