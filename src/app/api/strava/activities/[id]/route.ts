import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stravaFetch } from '@/lib/strava/api';

/**
 * GET /api/strava/activities/[id]
 * Fetches detailed activity from Strava (calories, full polyline, splits).
 * [id] is the strava_id (not our UUID).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
      { status: 401 }
    );
  }

  const { id } = await params;

  try {
    // Fetch detailed activity from Strava API
    const res = await stravaFetch(
      user.id, supabase,
      `/activities/${id}`
    );

    if (!res.ok) {
      throw new Error(`Strava API error: ${res.status}`);
    }

    const detail = await res.json();

    // Update cached activity with detailed fields
    await supabase
      .from('strava_activities')
      .update({
        calories: detail.calories ?? null,
        synced_at: new Date().toISOString(),
      })
      .eq('strava_id', parseInt(id, 10))
      .eq('user_id', user.id);

    // Return merged data
    return NextResponse.json({
      data: {
        strava_id: detail.id,
        name: detail.name,
        sport_type: detail.sport_type,
        start_date: detail.start_date,
        distance_m: detail.distance,
        moving_time_sec: detail.moving_time,
        elapsed_time_sec: detail.elapsed_time,
        total_elevation_gain_m: detail.total_elevation_gain,
        average_speed_mps: detail.average_speed,
        max_speed_mps: detail.max_speed,
        has_heartrate: detail.has_heartrate ?? false,
        average_heartrate: detail.average_heartrate ?? null,
        max_heartrate: detail.max_heartrate ?? null,
        calories: detail.calories ?? null,
        summary_polyline: detail.map?.summary_polyline ?? null,
        full_polyline: detail.map?.polyline ?? null,
        description: detail.description ?? null,
        elev_high: detail.elev_high ?? null,
        elev_low: detail.elev_low ?? null,
        device_name: detail.device_name ?? null,
        achievement_count: detail.achievement_count ?? 0,
        pr_count: detail.pr_count ?? 0,
        splits_metric: detail.splits_metric ?? null,
      },
      error: null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { data: null, error: { code: 'DETAIL_ERROR', message } },
      { status: 500 }
    );
  }
}
