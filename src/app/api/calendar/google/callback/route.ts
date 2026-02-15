import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getOAuth2Client } from '@/lib/calendar/google-client';
import { encryptToken } from '@/lib/calendar/encryption';
import { pullFromGoogle } from '@/lib/calendar/sync';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  const error = request.nextUrl.searchParams.get('error');

  // Build redirect URL for the calendar page
  const baseUrl = request.nextUrl.origin;
  const calendarUrl = `${baseUrl}/calendar`;

  if (error) {
    return NextResponse.redirect(`${calendarUrl}?google_error=${encodeURIComponent(error)}`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${calendarUrl}?google_error=missing_params`);
  }

  // Validate state
  try {
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    // Verify the state was created recently (within 10 minutes)
    if (Date.now() - stateData.ts > 10 * 60 * 1000) {
      return NextResponse.redirect(`${calendarUrl}?google_error=expired`);
    }
    // Verify user matches
    if (user && stateData.userId !== user.id) {
      return NextResponse.redirect(`${calendarUrl}?google_error=user_mismatch`);
    }
  } catch {
    return NextResponse.redirect(`${calendarUrl}?google_error=invalid_state`);
  }

  if (!user) {
    return NextResponse.redirect(`${calendarUrl}?google_error=not_authenticated`);
  }

  try {
    // Exchange code for tokens
    const oauth2 = getOAuth2Client();
    const { tokens } = await oauth2.getToken(code);

    if (!tokens.access_token || !tokens.refresh_token) {
      return NextResponse.redirect(`${calendarUrl}?google_error=no_tokens`);
    }

    // Encrypt tokens
    const encryptedAccess = encryptToken(tokens.access_token);
    const encryptedRefresh = encryptToken(tokens.refresh_token);
    const expiresAt = tokens.expiry_date
      ? new Date(tokens.expiry_date).toISOString()
      : new Date(Date.now() + 3600 * 1000).toISOString();

    // Upsert connection (one per user per provider)
    const { error: upsertError } = await supabase
      .from('calendar_connections')
      .upsert(
        {
          user_id: user.id,
          provider: 'google',
          access_token: encryptedAccess,
          refresh_token: encryptedRefresh,
          token_expires_at: expiresAt,
          calendar_id: 'primary',
          is_active: true,
          sync_token: null, // Reset for fresh full sync
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,provider' }
      );

    if (upsertError) {
      console.error('Calendar connection upsert error:', upsertError);
      return NextResponse.redirect(`${calendarUrl}?google_error=save_failed`);
    }

    // Trigger initial sync (non-blocking — if it fails, user can sync manually)
    try {
      await pullFromGoogle(user.id, supabase);
    } catch (syncErr) {
      console.error('Initial sync error (non-blocking):', syncErr);
    }

    return NextResponse.redirect(`${calendarUrl}?google_connected=true`);
  } catch (err) {
    console.error('Google Calendar callback error:', err);
    return NextResponse.redirect(`${calendarUrl}?google_error=exchange_failed`);
  }
}
