import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { encryptToken, decryptToken } from '@/lib/calendar/encryption';

/**
 * GET /api/strava/webhook
 * Responds to Strava's subscription validation challenge.
 */
export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get('hub.mode');
  const token = request.nextUrl.searchParams.get('hub.verify_token');
  const challenge = request.nextUrl.searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.STRAVA_WEBHOOK_VERIFY_TOKEN) {
    return NextResponse.json({ 'hub.challenge': challenge });
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

/**
 * POST /api/strava/webhook
 * Receives Strava webhook events for activity create/update/delete.
 * Uses service-role client since webhooks have no user session.
 */
export async function POST(request: NextRequest) {
  try {
    const event = await request.json();

    // We only handle activity events
    if (event.object_type !== 'activity') {
      // Handle athlete deauthorisation
      if (
        event.object_type === 'athlete' &&
        event.aspect_type === 'update' &&
        event.updates?.authorized === 'false'
      ) {
        const supabase = createServiceClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        await supabase
          .from('strava_connections')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq('strava_athlete_id', event.owner_id.toString());
      }

      return NextResponse.json({ received: true });
    }

    const stravaActivityId = event.object_id;
    const ownerId = event.owner_id.toString();
    const aspectType = event.aspect_type; // 'create' | 'update' | 'delete'

    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Find the user by their strava_athlete_id
    const { data: conn } = await supabase
      .from('strava_connections')
      .select('*')
      .eq('strava_athlete_id', ownerId)
      .eq('is_active', true)
      .single();

    if (!conn) {
      return NextResponse.json({ received: true });
    }

    if (aspectType === 'delete') {
      await supabase
        .from('strava_activities')
        .delete()
        .eq('strava_id', stravaActivityId)
        .eq('user_id', conn.user_id);

      return NextResponse.json({ received: true });
    }

    // For create/update — fetch the activity from Strava
    const accessToken = decryptToken(conn.access_token);
    const expiresAt = new Date(conn.token_expires_at).getTime();

    let token = accessToken;

    // Refresh if needed
    if (Date.now() >= expiresAt - 5 * 60 * 1000) {
      const refreshToken = decryptToken(conn.refresh_token);
      const res = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.STRAVA_CLIENT_ID!,
          client_secret: process.env.STRAVA_CLIENT_SECRET!,
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }),
      });

      if (res.ok) {
        const refreshed = await res.json();
        token = refreshed.access_token;

        // Update stored tokens
        await supabase
          .from('strava_connections')
          .update({
            access_token: encryptToken(refreshed.access_token),
            refresh_token: encryptToken(refreshed.refresh_token),
            token_expires_at: new Date(refreshed.expires_at * 1000).toISOString(),
          })
          .eq('id', conn.id);
      }
    }

    // Fetch the activity
    const activityRes = await fetch(
      `https://www.strava.com/api/v3/activities/${stravaActivityId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!activityRes.ok) {
      console.error('Webhook: failed to fetch activity', activityRes.status);
      return NextResponse.json({ received: true });
    }

    const a = await activityRes.json();

    await supabase
      .from('strava_activities')
      .upsert(
        {
          user_id: conn.user_id,
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
          calories: a.calories ?? null,
          summary_polyline: a.map?.summary_polyline ?? null,
          achievement_count: a.achievement_count ?? 0,
          pr_count: a.pr_count ?? 0,
          synced_at: new Date().toISOString(),
        },
        { onConflict: 'strava_id' }
      );

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Strava webhook error:', err);
    // Must return 200 to prevent Strava from retrying
    return NextResponse.json({ received: true });
  }
}
