import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStravaTokens } from '@/lib/strava/api';

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
      { status: 401 }
    );
  }

  try {
    // Attempt to deauthorise on Strava's side
    try {
      const { accessToken } = await getStravaTokens(user.id, supabase);
      await fetch('https://www.strava.com/oauth/deauthorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ access_token: accessToken }),
      });
    } catch {
      // If deauth fails (e.g. token already expired), continue with local disconnect
    }

    // Soft-delete the connection
    const { error } = await supabase
      .from('strava_connections')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('user_id', user.id);

    if (error) throw new Error(error.message);

    // Clean up cached activities
    await supabase
      .from('strava_activities')
      .delete()
      .eq('user_id', user.id);

    return NextResponse.json({ data: null, error: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { data: null, error: { code: 'DISCONNECT_ERROR', message } },
      { status: 500 }
    );
  }
}
