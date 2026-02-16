import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/strava/activities
 * Returns cached Strava activities from the database.
 * Query params: ?limit=30&offset=0&sport_type=Run
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
      { status: 401 }
    );
  }

  const limit = parseInt(request.nextUrl.searchParams.get('limit') ?? '30', 10);
  const offset = parseInt(request.nextUrl.searchParams.get('offset') ?? '0', 10);
  const sportType = request.nextUrl.searchParams.get('sport_type');

  try {
    // Check connection exists
    const { data: conn } = await supabase
      .from('strava_connections')
      .select('id, strava_athlete_id, display_name, profile_picture, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (!conn) {
      return NextResponse.json({
        data: { connection: null, activities: [], total: 0 },
        error: null,
      });
    }

    // Build query
    let query = supabase
      .from('strava_activities')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('start_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (sportType) {
      query = query.eq('sport_type', sportType);
    }

    const { data: activities, count, error } = await query;

    if (error) throw new Error(error.message);

    return NextResponse.json({
      data: {
        connection: conn,
        activities: activities ?? [],
        total: count ?? 0,
      },
      error: null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { data: null, error: { code: 'FETCH_ERROR', message } },
      { status: 500 }
    );
  }
}
