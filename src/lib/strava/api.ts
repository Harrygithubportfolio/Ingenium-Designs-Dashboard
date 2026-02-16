/**
 * Server-side Strava API helper.
 * Handles token decryption, automatic refresh, and authenticated fetch.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { encryptToken, decryptToken } from '@/lib/calendar/encryption';

const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token';
const STRAVA_API_BASE = 'https://www.strava.com/api/v3';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  connectionId: string;
}

/**
 * Fetch the user's Strava tokens from the database, auto-refreshing if expired.
 * Strava access tokens expire after 6 hours.
 * Important: Strava may rotate refresh tokens — always store the latest one.
 */
export async function getStravaTokens(
  userId: string,
  supabase: SupabaseClient
): Promise<TokenPair> {
  const { data: conn, error } = await supabase
    .from('strava_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();

  if (error || !conn) {
    throw new Error('No active Strava connection found');
  }

  const accessToken = decryptToken(conn.access_token);
  const refreshToken = decryptToken(conn.refresh_token);
  const expiresAt = new Date(conn.token_expires_at).getTime();
  const now = Date.now();

  // Refresh if expired or expiring within 5 minutes
  if (now >= expiresAt - 5 * 60 * 1000) {
    const refreshed = await refreshAccessToken(refreshToken);

    const encryptedAccess = encryptToken(refreshed.access_token);
    // Strava always returns a new refresh_token — always update it
    const encryptedRefresh = encryptToken(refreshed.refresh_token);

    const newExpiresAt = new Date(
      refreshed.expires_at * 1000
    ).toISOString();

    await supabase
      .from('strava_connections')
      .update({
        access_token: encryptedAccess,
        refresh_token: encryptedRefresh,
        token_expires_at: newExpiresAt,
      })
      .eq('id', conn.id);

    return {
      accessToken: refreshed.access_token,
      refreshToken: refreshed.refresh_token,
      expiresAt: newExpiresAt,
      connectionId: conn.id,
    };
  }

  return {
    accessToken,
    refreshToken,
    expiresAt: conn.token_expires_at,
    connectionId: conn.id,
  };
}

/**
 * Refresh an access token using Strava's token endpoint.
 * Unlike Spotify (which uses Basic auth), Strava uses form params.
 */
async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in: number;
}> {
  const res = await fetch(STRAVA_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.STRAVA_CLIENT_ID!,
      client_secret: process.env.STRAVA_CLIENT_SECRET!,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Strava token refresh failed: ${text}`);
  }

  return res.json();
}

/**
 * Authenticated fetch wrapper for Strava API v3.
 */
export async function stravaFetch(
  userId: string,
  supabase: SupabaseClient,
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const { accessToken } = await getStravaTokens(userId, supabase);

  return fetch(`${STRAVA_API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}
