import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(request: NextRequest) {
  const archived = request.nextUrl.searchParams.get('archived') === 'true';

  let query = supabase
    .from('workout_templates')
    .select('*, exercises:template_exercises(*)');

  if (!archived) {
    query = query.eq('is_archived', false);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) return NextResponse.json({ data: null, error: { code: 'QUERY_ERROR', message: error.message } }, { status: 500 });
  return NextResponse.json({ data, error: null });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, training_intent, description, exercises } = body;

  if (!name || !training_intent || !exercises?.length) {
    return NextResponse.json({ data: null, error: { code: 'VALIDATION', message: 'Missing required fields' } }, { status: 400 });
  }

  const { data: template, error: tErr } = await supabase
    .from('workout_templates')
    .insert({ name, training_intent, description: description ?? null })
    .select()
    .single();
  if (tErr) return NextResponse.json({ data: null, error: { code: 'INSERT_ERROR', message: tErr.message } }, { status: 500 });

  const exerciseRows = exercises.map((ex: any, i: number) => ({
    template_id: template.id,
    exercise_name: ex.exercise_name,
    sort_order: ex.sort_order ?? i,
    target_sets: ex.target_sets,
    target_reps: ex.target_reps,
    target_load_kg: ex.target_load_kg ?? null,
    target_rpe: ex.target_rpe ?? null,
    notes: ex.notes ?? null,
  }));

  const { error: eErr } = await supabase.from('template_exercises').insert(exerciseRows);
  if (eErr) return NextResponse.json({ data: null, error: { code: 'INSERT_ERROR', message: eErr.message } }, { status: 500 });

  return NextResponse.json({ data: template, error: null }, { status: 201 });
}
