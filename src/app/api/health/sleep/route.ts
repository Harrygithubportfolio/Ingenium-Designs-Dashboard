import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  }

  const date = request.nextUrl.searchParams.get('date');
  const from = request.nextUrl.searchParams.get('from');
  const to = request.nextUrl.searchParams.get('to');

  if (date) {
    const { data, error } = await supabase
      .from('sleep_logs')
      .select('*')
      .eq('log_date', date)
      .maybeSingle();
    if (error) return NextResponse.json({ data: null, error: { code: 'QUERY_ERROR', message: error.message } }, { status: 500 });
    return NextResponse.json({ data, error: null });
  }

  if (from && to) {
    const { data, error } = await supabase
      .from('sleep_logs')
      .select('*')
      .gte('log_date', from)
      .lte('log_date', to)
      .order('log_date', { ascending: true });
    if (error) return NextResponse.json({ data: null, error: { code: 'QUERY_ERROR', message: error.message } }, { status: 500 });
    return NextResponse.json({ data, error: null });
  }

  return NextResponse.json({ data: null, error: { code: 'VALIDATION', message: 'Provide date or from+to' } }, { status: 400 });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  }

  const body = await request.json();
  const { log_date, hours_slept, quality, bed_time, wake_time, notes } = body;

  if (!log_date || hours_slept === undefined || !quality) {
    return NextResponse.json({ data: null, error: { code: 'VALIDATION', message: 'Missing required fields' } }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('sleep_logs')
    .upsert(
      {
        user_id: user.id,
        log_date,
        hours_slept,
        quality,
        bed_time: bed_time || null,
        wake_time: wake_time || null,
        notes: notes || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,log_date' },
    )
    .select()
    .single();

  if (error) return NextResponse.json({ data: null, error: { code: 'UPSERT_ERROR', message: error.message } }, { status: 500 });
  return NextResponse.json({ data, error: null });
}
