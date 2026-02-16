import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { encryptToken } from '@/lib/calendar/encryption';

const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  const error = request.nextUrl.searchParams.get('error');

  // Build redirect URL
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
  const baseUrl = forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : request.nextUrl.origin;
  const stravaUrl = `${baseUrl}/strava`;

  if (error) {
    return NextResponse.redirect(
      `${stravaUrl}?strava_error=${encodeURIComponent(error)}`
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(`${stravaUrl}?strava_error=missing_params`);
  }

  // Validate state
  try {
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    if (Date.now() - stateData.ts > 10 * 60 * 1000) {
      return NextResponse.redirect(`${stravaUrl}?strava_error=expired`);
    }
    if (user && stateData.userId !== user.id) {
      return NextResponse.redirect(`${stravaUrl}?strava_error=user_mismatch`);
    }
  } catch {
    return NextResponse.redirect(`${stravaUrl}?strava_error=invalid_state`);
  }

  if (!user) {
    return NextResponse.redirect(
      `${stravaUrl}?strava_error=not_authenticated`
    );
  }

  try {
    // Exchange code for tokens — Strava includes athlete profile in the token response
    const tokenRes = await fetch(STRAVA_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.STRAVA_CLIENT_ID!,
        client_secret: process.env.STRAVA_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      console.error('Strava token exchange failed:', await tokenRes.text());
      return NextResponse.redirect(
        `${stravaUrl}?strava_error=exchange_failed`
      );
    }

    const tokens = await tokenRes.json();

    if (!tokens.access_token || !tokens.refresh_token) {
      return NextResponse.redirect(`${stravaUrl}?strava_error=no_tokens`);
    }

    // Strava returns athlete profile in the token response
    const athlete = tokens.athlete;
    const stravaAthleteId = athlete?.id?.toString() ?? null;
    const displayName = athlete
      ? [athlete.firstname, athlete.lastname].filter(Boolean).join(' ')
      : null;
    const profilePicture = athlete?.profile ?? null;

    // Encrypt tokens
    const encryptedAccess = encryptToken(tokens.access_token);
    const encryptedRefresh = encryptToken(tokens.refresh_token);
    const expiresAt = new Date(tokens.expires_at * 1000).toISOString();

    // Upsert connection
    const { error: upsertError } = await supabase
      .from('strava_connections')
      .upsert(
        {
          user_id: user.id,
          access_token: encryptedAccess,
          refresh_token: encryptedRefresh,
          token_expires_at: expiresAt,
          strava_athlete_id: stravaAthleteId,
          display_name: displayName,
          profile_picture: profilePicture,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

    if (upsertError) {
      console.error('Strava connection upsert error:', upsertError);
      return NextResponse.redirect(`${stravaUrl}?strava_error=save_failed`);
    }

    return NextResponse.redirect(`${stravaUrl}?connected=true`);
  } catch (err) {
    console.error('Strava callback error:', err);
    return NextResponse.redirect(
      `${stravaUrl}?strava_error=exchange_failed`
    );
  }
}
