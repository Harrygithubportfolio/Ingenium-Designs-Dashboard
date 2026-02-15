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
  const habitId = request.nextUrl.searchParams.get('habit_id');

  let query = supabase.from('habit_completions').select('*');

  if (habitId) query = query.eq('habit_id', habitId);
  if (from) query = query.gte('completion_date', from);
  if (to) query = query.lte('completion_date', to);

  const { data, error } = await query.order('completion_date', { ascending: false });
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
  const { habit_id, completion_date, completed_by, notes } = body;

  if (!habit_id || !completion_date) {
    return NextResponse.json({ data: null, error: { code: 'VALIDATION', message: 'habit_id and completion_date are required' } }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('habit_completions')
    .insert({
      habit_id,
      completion_date,
      completed_by: completed_by || 'manual',
      notes: notes || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ data: null, error: { code: 'INSERT_ERROR', message: error.message } }, { status: 500 });
  return NextResponse.json({ data, error: null }, { status: 201 });
}
