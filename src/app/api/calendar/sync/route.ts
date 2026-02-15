import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { pullFromGoogle } from '@/lib/calendar/sync';

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  }

  try {
    const result = await pullFromGoogle(user.id, supabase);
    return NextResponse.json({ data: result, error: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown sync error';
    return NextResponse.json({ data: null, error: { code: 'SYNC_ERROR', message } }, { status: 500 });
  }
}
