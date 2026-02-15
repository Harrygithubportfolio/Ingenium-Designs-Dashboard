import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getOAuth2Client } from '@/lib/calendar/google-client';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const oauth2 = getOAuth2Client();

  const authUrl = oauth2.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent', // Force consent to ensure refresh token is returned
    scope: ['https://www.googleapis.com/auth/calendar.events'],
    state: Buffer.from(JSON.stringify({ userId: user.id, ts: Date.now() })).toString('base64'),
  });

  return NextResponse.redirect(authUrl);
}
