import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { disconnectGoogle } from '@/lib/calendar/mutations';

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  }

  try {
    await disconnectGoogle(supabase, user.id);
    return NextResponse.json({ data: null, error: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ data: null, error: { code: 'DISCONNECT_ERROR', message } }, { status: 500 });
  }
}
