import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSpotifyTokens } from '@/lib/spotify/api';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { accessToken, expiresAt } = await getSpotifyTokens(user.id, supabase);

    const expiresIn = Math.max(
      0,
      Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)
    );

    return NextResponse.json({
      access_token: accessToken,
      expires_in: expiresIn,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Token fetch failed';
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
