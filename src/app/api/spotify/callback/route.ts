import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { encryptToken } from '@/lib/calendar/encryption';

const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

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
  const spotifyUrl = `${baseUrl}/spotify`;

  if (error) {
    return NextResponse.redirect(
      `${spotifyUrl}?spotify_error=${encodeURIComponent(error)}`
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(`${spotifyUrl}?spotify_error=missing_params`);
  }

  // Validate state
  try {
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    if (Date.now() - stateData.ts > 10 * 60 * 1000) {
      return NextResponse.redirect(`${spotifyUrl}?spotify_error=expired`);
    }
    if (user && stateData.userId !== user.id) {
      return NextResponse.redirect(`${spotifyUrl}?spotify_error=user_mismatch`);
    }
  } catch {
    return NextResponse.redirect(`${spotifyUrl}?spotify_error=invalid_state`);
  }

  if (!user) {
    return NextResponse.redirect(
      `${spotifyUrl}?spotify_error=not_authenticated`
    );
  }

  try {
    // Exchange code for tokens
    const clientId = process.env.SPOTIFY_CLIENT_ID!;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;
    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const tokenRes = await fetch(SPOTIFY_TOKEN_URL, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.SPOTIFY_REDIRECT_URI!,
      }),
    });

    if (!tokenRes.ok) {
      console.error('Spotify token exchange failed:', await tokenRes.text());
      return NextResponse.redirect(
        `${spotifyUrl}?spotify_error=exchange_failed`
      );
    }

    const tokens = await tokenRes.json();

    if (!tokens.access_token || !tokens.refresh_token) {
      return NextResponse.redirect(`${spotifyUrl}?spotify_error=no_tokens`);
    }

    // Fetch user profile to get spotify_user_id, display_name, product
    const profileRes = await fetch(`${SPOTIFY_API_BASE}/me`, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    let spotifyUserId: string | null = null;
    let displayName: string | null = null;
    let product = 'free';

    if (profileRes.ok) {
      const profile = await profileRes.json();
      spotifyUserId = profile.id;
      displayName = profile.display_name;
      product = profile.product || 'free';
    }

    // Encrypt tokens
    const encryptedAccess = encryptToken(tokens.access_token);
    const encryptedRefresh = encryptToken(tokens.refresh_token);
    const expiresAt = new Date(
      Date.now() + (tokens.expires_in || 3600) * 1000
    ).toISOString();

    // Upsert connection
    const { error: upsertError } = await supabase
      .from('spotify_connections')
      .upsert(
        {
          user_id: user.id,
          access_token: encryptedAccess,
          refresh_token: encryptedRefresh,
          token_expires_at: expiresAt,
          spotify_user_id: spotifyUserId,
          display_name: displayName,
          product,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

    if (upsertError) {
      console.error('Spotify connection upsert error:', upsertError);
      return NextResponse.redirect(`${spotifyUrl}?spotify_error=save_failed`);
    }

    return NextResponse.redirect(`${spotifyUrl}?connected=true`);
  } catch (err) {
    console.error('Spotify callback error:', err);
    return NextResponse.redirect(
      `${spotifyUrl}?spotify_error=exchange_failed`
    );
  }
}
