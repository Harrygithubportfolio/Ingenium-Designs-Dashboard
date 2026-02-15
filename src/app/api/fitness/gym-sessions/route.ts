import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { scheduled_workout_id } = body;

  let templateId: string | null = null;
  if (scheduled_workout_id) {
    const { data: sw, error: swErr } = await supabase
      .from('scheduled_workouts')
      .select('template_id')
      .eq('id', scheduled_workout_id)
      .single();
    if (swErr) return NextResponse.json({ data: null, error: { code: 'NOT_FOUND', message: 'Scheduled workout not found' } }, { status: 404 });
    templateId = sw.template_id;
  }

  const { data: session, error: sErr } = await supabase
    .from('gym_sessions')
    .insert({
      scheduled_workout_id: scheduled_workout_id ?? null,
      template_id: templateId,
      status: 'active',
    })
    .select()
    .single();
  if (sErr) return NextResponse.json({ data: null, error: { code: 'INSERT_ERROR', message: sErr.message } }, { status: 500 });

  if (templateId) {
    const { data: templateExercises } = await supabase
      .from('template_exercises')
      .select('*')
      .eq('template_id', templateId)
      .order('sort_order', { ascending: true });

    if (templateExercises?.length) {
      const execExercises = templateExercises.map((te: any) => ({
        gym_session_id: session.id,
        template_exercise_id: te.id,
        exercise_name: te.exercise_name,
        sort_order: te.sort_order,
      }));
      await supabase.from('execution_exercises').insert(execExercises);
    }
  }

  const { data: fullSession } = await supabase
    .from('gym_sessions')
    .select('*, exercises:execution_exercises(*, sets:execution_sets(*))')
    .eq('id', session.id)
    .single();

  return NextResponse.json({ data: fullSession, error: null }, { status: 201 });
}
