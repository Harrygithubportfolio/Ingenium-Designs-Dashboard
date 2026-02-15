import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchConnection } from '@/lib/calendar/queries';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  }

  try {
    const data = await fetchConnection(supabase);
    return NextResponse.json({ data, error: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ data: null, error: { code: 'QUERY_ERROR', message } }, { status: 500 });
  }
}
