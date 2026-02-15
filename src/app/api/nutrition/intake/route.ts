import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  }

  const date = request.nextUrl.searchParams.get('date') ?? new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('intake_events')
    .select('*, items:intake_items(*)')
    .gte('event_timestamp', `${date}T00:00:00`)
    .lte('event_timestamp', `${date}T23:59:59`)
    .order('event_timestamp', { ascending: true });

  if (error) return NextResponse.json({ data: null, error: { code: 'QUERY_ERROR', message: error.message } }, { status: 500 });
  return NextResponse.json({ data, error: null });
}
