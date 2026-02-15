import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  CreateTemplateInput,
  LogSetInput,
  ReflectionInput,
  GymSession,
  ExecutionExercise,
  ExecutionSet,
  WorkoutReflection,
} from './types';

// --- Templates ---

export async function createTemplate(supabase: SupabaseClient, userId: string, input: CreateTemplateInput) {
  const { data: template, error: tErr } = await supabase
    .from('workout_templates')
    .insert({
      user_id: userId,
      name: input.name,
      training_intent: input.training_intent,
      description: input.description ?? null,
    })
    .select()
    .single();
  if (tErr) throw new Error(tErr.message);

  const exercises = input.exercises.map((ex) => ({
    template_id: template.id,
    ...ex,
  }));

  const { error: eErr } = await supabase.from('template_exercises').insert(exercises);
  if (eErr) throw new Error(eErr.message);

  return template;
}

export async function updateTemplate(supabase: SupabaseClient, id: string, input: CreateTemplateInput) {
  const { error: tErr } = await supabase
    .from('workout_templates')
    .update({
      name: input.name,
      training_intent: input.training_intent,
      description: input.description ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (tErr) throw new Error(tErr.message);

  // Replace all exercises
  const { error: dErr } = await supabase
    .from('template_exercises')
    .delete()
    .eq('template_id', id);
  if (dErr) throw new Error(dErr.message);

  const exercises = input.exercises.map((ex) => ({
    template_id: id,
    ...ex,
  }));
  const { error: eErr } = await supabase.from('template_exercises').insert(exercises);
  if (eErr) throw new Error(eErr.message);
}

export async function archiveTemplate(supabase: SupabaseClient, id: string) {
  const { error } = await supabase
    .from('workout_templates')
    .update({ is_archived: true, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

// --- Scheduling ---

export async function scheduleWorkout(supabase: SupabaseClient, userId: string, templateId: string, date: string) {
  const { data, error } = await supabase
    .from('scheduled_workouts')
    .insert({ user_id: userId, template_id: templateId, scheduled_date: date })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function rescheduleWorkout(supabase: SupabaseClient, userId: string, id: string, newDate: string) {
  // Mark original as rescheduled
  const { error: uErr } = await supabase
    .from('scheduled_workouts')
    .update({
      status: 'rescheduled',
      rescheduled_to: newDate,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (uErr) throw new Error(uErr.message);

  // Get original to copy template
  const { data: original, error: gErr } = await supabase
    .from('scheduled_workouts')
    .select('template_id')
    .eq('id', id)
    .single();
  if (gErr) throw new Error(gErr.message);

  // Create new scheduled workout
  const { data, error: cErr } = await supabase
    .from('scheduled_workouts')
    .insert({
      user_id: userId,
      template_id: original.template_id,
      scheduled_date: newDate,
      rescheduled_from_id: id,
    })
    .select()
    .single();
  if (cErr) throw new Error(cErr.message);
  return data;
}

// --- Gym Sessions ---

export async function startGymSession(supabase: SupabaseClient, userId: string, scheduledWorkoutId?: string) {
  // If starting from a scheduled workout, get the template
  let templateId: string | null = null;
  if (scheduledWorkoutId) {
    const { data: sw, error: swErr } = await supabase
      .from('scheduled_workouts')
      .select('template_id')
      .eq('id', scheduledWorkoutId)
      .single();
    if (swErr) throw new Error(swErr.message);
    templateId = sw.template_id;
  }

  // Create the session
  const { data: session, error: sErr } = await supabase
    .from('gym_sessions')
    .insert({
      user_id: userId,
      scheduled_workout_id: scheduledWorkoutId ?? null,
      template_id: templateId,
      status: 'active',
    })
    .select()
    .single();
  if (sErr) throw new Error(sErr.message);

  // If there's a template, copy exercises into execution_exercises
  if (templateId) {
    const { data: templateExercises, error: teErr } = await supabase
      .from('template_exercises')
      .select('*')
      .eq('template_id', templateId)
      .order('sort_order', { ascending: true });
    if (teErr) throw new Error(teErr.message);

    if (templateExercises && templateExercises.length > 0) {
      const execExercises = templateExercises.map((te) => ({
        gym_session_id: session.id,
        template_exercise_id: te.id,
        exercise_name: te.exercise_name,
        sort_order: te.sort_order,
        was_skipped: false,
        is_additional: false,
      }));

      const { error: eeErr } = await supabase
        .from('execution_exercises')
        .insert(execExercises);
      if (eeErr) throw new Error(eeErr.message);
    }
  }

  return session as GymSession;
}

export async function logSet(supabase: SupabaseClient, sessionId: string, input: LogSetInput) {
  // Get the next set number
  const { data: existing, error: cErr } = await supabase
    .from('execution_sets')
    .select('set_number')
    .eq('execution_exercise_id', input.execution_exercise_id)
    .order('set_number', { ascending: false })
    .limit(1);
  if (cErr) throw new Error(cErr.message);

  const nextSetNumber = existing && existing.length > 0 ? existing[0].set_number + 1 : 1;

  const { data, error } = await supabase
    .from('execution_sets')
    .insert({
      execution_exercise_id: input.execution_exercise_id,
      set_number: nextSetNumber,
      actual_weight_kg: input.actual_weight_kg,
      actual_reps: input.actual_reps,
      notes: input.notes ?? null,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as ExecutionSet;
}

export async function addExerciseToSession(supabase: SupabaseClient, sessionId: string, exerciseName: string) {
  // Get next sort_order
  const { data: existing, error: cErr } = await supabase
    .from('execution_exercises')
    .select('sort_order')
    .eq('gym_session_id', sessionId)
    .order('sort_order', { ascending: false })
    .limit(1);
  if (cErr) throw new Error(cErr.message);

  const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;

  const { data, error } = await supabase
    .from('execution_exercises')
    .insert({
      gym_session_id: sessionId,
      exercise_name: exerciseName,
      sort_order: nextOrder,
      is_additional: true,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as ExecutionExercise;
}

export async function skipExercise(supabase: SupabaseClient, exerciseId: string) {
  const { error } = await supabase
    .from('execution_exercises')
    .update({ was_skipped: true })
    .eq('id', exerciseId);
  if (error) throw new Error(error.message);
}

export async function updateSessionStatus(
  supabase: SupabaseClient,
  sessionId: string,
  status: 'active' | 'paused' | 'completed' | 'abandoned'
) {
  const updates: Record<string, unknown> = { status };

  if (status === 'completed' || status === 'abandoned') {
    updates.ended_at = new Date().toISOString();

    // Compute totals for completed sessions
    if (status === 'completed') {
      const { data: exercises } = await supabase
        .from('execution_exercises')
        .select('*, sets:execution_sets(*)')
        .eq('gym_session_id', sessionId);

      let totalVolume = 0;
      if (exercises) {
        for (const ex of exercises) {
          for (const set of (ex.sets ?? [])) {
            totalVolume += set.actual_weight_kg * set.actual_reps;
          }
        }
      }

      const { data: session } = await supabase
        .from('gym_sessions')
        .select('started_at')
        .eq('id', sessionId)
        .single();

      if (session) {
        updates.total_duration_sec = Math.floor(
          (Date.now() - new Date(session.started_at).getTime()) / 1000
        );
      }
      updates.total_volume_kg = totalVolume;
    }
  }

  const { data, error } = await supabase
    .from('gym_sessions')
    .update(updates)
    .eq('id', sessionId)
    .select()
    .single();
  if (error) throw new Error(error.message);

  // Update scheduled workout status if completing
  if (status === 'completed') {
    const session = data as GymSession;
    if (session.scheduled_workout_id) {
      await supabase
        .from('scheduled_workouts')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', session.scheduled_workout_id);
    }
  }

  return data as GymSession;
}

// --- Reflections ---

export async function createReflection(supabase: SupabaseClient, userId: string, gymSessionId: string) {
  // Get session data for computation
  const { data: session } = await supabase
    .from('gym_sessions')
    .select(`
      *,
      exercises:execution_exercises(*, sets:execution_sets(*))
    `)
    .eq('id', gymSessionId)
    .single();
  if (!session) throw new Error('Session not found');

  // Compute executed volume
  let executedVolume = 0;
  const exercises = session.exercises ?? [];
  for (const ex of exercises) {
    for (const set of (ex.sets ?? [])) {
      executedVolume += set.actual_weight_kg * set.actual_reps;
    }
  }

  // Compute planned volume if there's a template
  let plannedVolume: number | null = null;
  if (session.template_id) {
    const { data: templateExercises } = await supabase
      .from('template_exercises')
      .select('*')
      .eq('template_id', session.template_id);

    if (templateExercises) {
      plannedVolume = 0;
      for (const te of templateExercises) {
        plannedVolume += (te.target_load_kg ?? 0) * te.target_reps * te.target_sets;
      }
    }
  }

  const volumeDelta = plannedVolume && plannedVolume > 0
    ? ((executedVolume - plannedVolume) / plannedVolume) * 100
    : null;

  const { data, error } = await supabase
    .from('workout_reflections')
    .insert({
      user_id: userId,
      gym_session_id: gymSessionId,
      planned_volume_kg: plannedVolume,
      executed_volume_kg: executedVolume,
      volume_delta_pct: volumeDelta ? parseFloat(volumeDelta.toFixed(2)) : null,
      personal_records: [],
      missed_targets: [],
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as WorkoutReflection;
}

export async function updateReflection(supabase: SupabaseClient, gymSessionId: string, input: ReflectionInput) {
  const { data, error } = await supabase
    .from('workout_reflections')
    .update({
      session_rating: input.session_rating ?? null,
      reflection_note: input.reflection_note ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('gym_session_id', gymSessionId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as WorkoutReflection;
}
