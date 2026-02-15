import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { spotifyFetch } from '@/lib/spotify/api';

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { context_uri, uris, device_id, offset } = body;

    const queryParams = device_id ? `?device_id=${device_id}` : '';
    const payload: Record<string, unknown> = {};

    if (context_uri) payload.context_uri = context_uri;
    if (uris) payload.uris = uris;
    if (offset !== undefined) payload.offset = { position: offset };

    const res = await spotifyFetch(
      user.id,
      supabase,
      `/me/player/play${queryParams}`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok && res.status !== 204) {
      const text = await res.text();
      console.error('Spotify play error:', text);
      return NextResponse.json({ error: 'Failed to start playback' }, { status: res.status });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
