import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { spotifyFetch } from '@/lib/spotify/api';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const res = await spotifyFetch(user.id, supabase, '/me/playlists?limit=50');

    if (!res.ok) {
      const text = await res.text();
      console.error('Spotify playlists error:', text);
      return NextResponse.json({ error: 'Failed to fetch playlists' }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json({ items: data.items ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
