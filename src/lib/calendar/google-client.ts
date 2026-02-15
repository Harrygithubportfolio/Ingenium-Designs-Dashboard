/**
 * Server-only: Creates an authenticated Google Calendar API client.
 * Handles token refresh transparently.
 */
import { google } from 'googleapis';
import type { SupabaseClient } from '@supabase/supabase-js';
import { encryptToken, decryptToken } from './encryption';

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

export { getOAuth2Client };

/**
 * Fetch the user's calendar connection, decrypt tokens,
 * refresh if expired, and return an authenticated Calendar client.
 */
export async function getGoogleCalendarClient(userId: string, supabase: SupabaseClient) {
  // Fetch connection with tokens
  const { data: conn, error } = await supabase
    .from('calendar_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', 'google')
    .eq('is_active', true)
    .single();

  if (error || !conn) {
    throw new Error('No active Google Calendar connection found');
  }

  const oauth2 = getOAuth2Client();
  const accessToken = decryptToken(conn.access_token);
  const refreshToken = decryptToken(conn.refresh_token);

  oauth2.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
    expiry_date: new Date(conn.token_expires_at).getTime(),
  });

  // Check if token is expired or about to expire (within 5 minutes)
  const now = Date.now();
  const expiresAt = new Date(conn.token_expires_at).getTime();
  if (now >= expiresAt - 5 * 60 * 1000) {
    try {
      const { credentials } = await oauth2.refreshAccessToken();
      oauth2.setCredentials(credentials);

      // Update stored tokens
      await supabase
        .from('calendar_connections')
        .update({
          access_token: encryptToken(credentials.access_token!),
          refresh_token: credentials.refresh_token
            ? encryptToken(credentials.refresh_token)
            : conn.refresh_token, // keep existing if not returned
          token_expires_at: new Date(credentials.expiry_date!).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', conn.id);
    } catch (refreshError) {
      // Token revoked — deactivate connection
      await supabase
        .from('calendar_connections')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', conn.id);
      throw new Error('Google Calendar access has been revoked. Please reconnect.');
    }
  }

  return {
    calendar: google.calendar({ version: 'v3', auth: oauth2 }),
    connection: conn,
  };
}
