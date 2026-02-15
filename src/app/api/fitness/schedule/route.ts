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

  if (!from) {
    return NextResponse.json({ data: null, error: { code: 'VALIDATION', message: 'from date required' } }, { status: 400 });
  }

  const toDate = to ?? new Date(new Date(from).getTime() + 7 * 86400000).toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('scheduled_workouts')
    .select('*, template:workout_templates(id, name, training_intent)')
    .gte('scheduled_date', from)
    .lte('scheduled_date', toDate)
    .order('scheduled_date', { ascending: true });

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
  const { template_id, scheduled_date } = body;

  if (!template_id || !scheduled_date) {
    return NextResponse.json({ data: null, error: { code: 'VALIDATION', message: 'template_id and scheduled_date required' } }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('scheduled_workouts')
    .insert({ user_id: user.id, template_id, scheduled_date })
    .select()
    .single();

  if (error) return NextResponse.json({ data: null, error: { code: 'INSERT_ERROR', message: error.message } }, { status: 500 });
  return NextResponse.json({ data, error: null }, { status: 201 });
}
