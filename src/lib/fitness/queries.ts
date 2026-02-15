import type { SupabaseClient } from '@supabase/supabase-js';
import type { WorkoutTemplate, ScheduledWorkout, GymSession, WorkoutReflection } from './types';

export async function fetchTemplates(supabase: SupabaseClient, includeArchived = false) {
  let query = supabase
    .from('workout_templates')
    .select('*, exercises:template_exercises(*)');

  if (!includeArchived) {
    query = query.eq('is_archived', false);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data as WorkoutTemplate[]) ?? [];
}

export async function fetchTemplate(supabase: SupabaseClient, id: string) {
  const { data, error } = await supabase
    .from('workout_templates')
    .select('*, exercises:template_exercises(*)')
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  return data as WorkoutTemplate;
}

export async function fetchSchedule(supabase: SupabaseClient, from: string, to: string) {
  const { data, error } = await supabase
    .from('scheduled_workouts')
    .select('*, template:workout_templates(id, name, training_intent, description, exercises:template_exercises(*))')
    .gte('scheduled_date', from)
    .lte('scheduled_date', to)
    .order('scheduled_date', { ascending: true });
  if (error) throw new Error(error.message);
  return (data as ScheduledWorkout[]) ?? [];
}

export async function fetchTodaySchedule(supabase: SupabaseClient) {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('scheduled_workouts')
    .select('*, template:workout_templates(id, name, training_intent, exercises:template_exercises(*))')
    .eq('scheduled_date', today)
    .eq('status', 'scheduled')
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as ScheduledWorkout | null;
}

export async function fetchActiveGymSession(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('gym_sessions')
    .select(`
      *,
      exercises:execution_exercises(
        *,
        sets:execution_sets(*)
      )
    `)
    .in('status', ['active', 'paused'])
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as GymSession | null;
}

export async function fetchGymSession(supabase: SupabaseClient, id: string) {
  const { data, error } = await supabase
    .from('gym_sessions')
    .select(`
      *,
      exercises:execution_exercises(
        *,
        sets:execution_sets(*)
      )
    `)
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  return data as GymSession;
}

export async function fetchWorkoutHistory(supabase: SupabaseClient, from?: string, to?: string, limit = 20) {
  let query = supabase
    .from('gym_sessions')
    .select(`
      *,
      template:workout_templates(name, training_intent),
      exercises:execution_exercises(
        *,
        sets:execution_sets(*)
      ),
      reflection:workout_reflections(*)
    `)
    .in('status', ['completed', 'abandoned'])
    .order('started_at', { ascending: false })
    .limit(limit);

  if (from) query = query.gte('started_at', from);
  if (to) query = query.lte('started_at', to);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as GymSession[]) ?? [];
}

export async function fetchReflection(supabase: SupabaseClient, gymSessionId: string) {
  const { data, error } = await supabase
    .from('workout_reflections')
    .select('*')
    .eq('gym_session_id', gymSessionId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as WorkoutReflection | null;
}

export async function fetchExerciseHistory(supabase: SupabaseClient, exerciseName: string) {
  const { data, error } = await supabase
    .from('execution_exercises')
    .select(`
      exercise_name,
      gym_session_id,
      sets:execution_sets(
        set_number,
        actual_weight_kg,
        actual_reps,
        logged_at
      ),
      session:gym_sessions!inner(
        id,
        started_at,
        status
      )
    `)
    .ilike('exercise_name', exerciseName)
    .in('session.status' as never, ['completed'])
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function fetchDistinctExercises(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('execution_exercises')
    .select('exercise_name')
    .order('exercise_name', { ascending: true });

  if (error) throw new Error(error.message);
  const unique = [...new Set((data ?? []).map((d) => d.exercise_name))];
  return unique;
}
