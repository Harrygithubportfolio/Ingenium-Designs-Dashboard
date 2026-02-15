import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  }

  const from = request.nextUrl.searchParams.get('from');
  const to = request.nextUrl.searchParams.get('to');
  const latest = request.nextUrl.searchParams.get('latest') === 'true';

  if (latest) {
    const { data, error } = await supabase
      .from('body_measurements')
      .select('*')
      .order('measured_date', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) return NextResponse.json({ data: null, error: { code: 'QUERY_ERROR', message: error.message } }, { status: 500 });
    return NextResponse.json({ data, error: null });
  }

  let query = supabase.from('body_measurements').select('*').order('measured_date', { ascending: true });
  if (from) query = query.gte('measured_date', from);
  if (to) query = query.lte('measured_date', to);

  const { data, error } = await query;
  if (error) return NextResponse.json({ data: null, error: { code: 'QUERY_ERROR', message: error.message } }, { status: 500 });
  return NextResponse.json({ data, error: null });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  }

  const body = await request.json();
  const { measured_date, ...measurements } = body;

  if (!measured_date) {
    return NextResponse.json({ data: null, error: { code: 'VALIDATION', message: 'measured_date is required' } }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('body_measurements')
    .upsert(
      { user_id: user.id, measured_date, ...measurements, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,measured_date' },
    )
    .select()
    .single();

  if (error) return NextResponse.json({ data: null, error: { code: 'UPSERT_ERROR', message: error.message } }, { status: 500 });
  return NextResponse.json({ data, error: null });
}
