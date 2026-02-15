/**
 * Server-side Spotify API helper.
 * Handles token decryption, automatic refresh, and authenticated fetch.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { encryptToken, decryptToken } from '@/lib/calendar/encryption';

const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  connectionId: string;
}

/**
 * Fetch the user's Spotify tokens from the database, auto-refreshing if expired.
 */
export async function getSpotifyTokens(
  userId: string,
  supabase: SupabaseClient
): Promise<TokenPair> {
  const { data: conn, error } = await supabase
    .from('spotify_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();

  if (error || !conn) {
    throw new Error('No active Spotify connection found');
  }

  const accessToken = decryptToken(conn.access_token);
  const refreshToken = decryptToken(conn.refresh_token);
  const expiresAt = new Date(conn.token_expires_at).getTime();
  const now = Date.now();

  // Refresh if expired or expiring within 5 minutes
  if (now >= expiresAt - 5 * 60 * 1000) {
    const refreshed = await refreshAccessToken(refreshToken);

    const encryptedAccess = encryptToken(refreshed.access_token);
    const encryptedRefresh = refreshed.refresh_token
      ? encryptToken(refreshed.refresh_token)
      : conn.refresh_token;

    const newExpiresAt = new Date(
      Date.now() + refreshed.expires_in * 1000
    ).toISOString();

    await supabase
      .from('spotify_connections')
      .update({
        access_token: encryptedAccess,
        refresh_token: encryptedRefresh,
        token_expires_at: newExpiresAt,
      })
      .eq('id', conn.id);

    return {
      accessToken: refreshed.access_token,
      refreshToken: refreshed.refresh_token || refreshToken,
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
 * Refresh an access token using Spotify's token endpoint.
 */
async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}> {
  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Spotify token refresh failed: ${text}`);
  }

  return res.json();
}

/**
 * Authenticated fetch wrapper for Spotify Web API.
 */
export async function spotifyFetch(
  userId: string,
  supabase: SupabaseClient,
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const { accessToken } = await getSpotifyTokens(userId, supabase);

  return fetch(`${SPOTIFY_API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}
