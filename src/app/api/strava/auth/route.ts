import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const STRAVA_AUTH_URL = 'https://www.strava.com/oauth/authorize';

const SCOPES = 'read,activity:read_all,profile:read_all';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const state = Buffer.from(
    JSON.stringify({ userId: user.id, ts: Date.now() })
  ).toString('base64');

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.STRAVA_CLIENT_ID!,
    scope: SCOPES,
    redirect_uri: process.env.STRAVA_REDIRECT_URI!,
    state,
    approval_prompt: 'auto',
  });

  return NextResponse.redirect(`${STRAVA_AUTH_URL}?${params.toString()}`);
}
