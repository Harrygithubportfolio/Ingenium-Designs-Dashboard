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

// --- Dashboard Queries ---

export async function fetchMonthlyWorkoutStats(supabase: SupabaseClient) {
  const now = new Date();
  const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const endOfMonth = lastDay.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('gym_sessions')
    .select('id, total_volume_kg')
    .eq('status', 'completed')
    .gte('started_at', `${firstOfMonth}T00:00:00`)
    .lte('started_at', `${endOfMonth}T23:59:59`);
  if (error) throw new Error(error.message);

  const sessions = data ?? [];
  return {
    workoutCount: sessions.length,
    totalVolume: sessions.reduce((sum, s) => sum + Number(s.total_volume_kg ?? 0), 0),
  };
}

export async function fetchWorkoutHeatmapData(supabase: SupabaseClient, weeks = 20) {
  const since = new Date();
  since.setDate(since.getDate() - weeks * 7);

  const { data, error } = await supabase
    .from('gym_sessions')
    .select('started_at')
    .eq('status', 'completed')
    .gte('started_at', since.toISOString())
    .order('started_at', { ascending: true });
  if (error) throw new Error(error.message);

  const heatmap: Record<string, number> = {};
  for (const session of data ?? []) {
    const date = session.started_at.slice(0, 10);
    heatmap[date] = (heatmap[date] ?? 0) + 1;
  }
  return heatmap;
}

export async function fetchVolumeOverTime(supabase: SupabaseClient, weeks = 12) {
  const since = new Date();
  since.setDate(since.getDate() - weeks * 7);

  const { data, error } = await supabase
    .from('gym_sessions')
    .select('started_at, total_volume_kg')
    .eq('status', 'completed')
    .gte('started_at', since.toISOString())
    .order('started_at', { ascending: true });
  if (error) throw new Error(error.message);

  // Aggregate by ISO week
  const weeklyVolume: Record<string, number> = {};
  for (const session of data ?? []) {
    const date = new Date(session.started_at);
    // Get ISO week start (Monday)
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const weekStart = new Date(date.setDate(diff)).toISOString().split('T')[0];
    weeklyVolume[weekStart] = (weeklyVolume[weekStart] ?? 0) + Number(session.total_volume_kg ?? 0);
  }

  return Object.entries(weeklyVolume).map(([week, volume]) => ({
    week,
    volume: Math.round(volume),
  }));
}

export async function fetchRecentCompletedSessions(supabase: SupabaseClient, limit = 5) {
  const { data, error } = await supabase
    .from('gym_sessions')
    .select(`
      id, started_at, ended_at, total_volume_kg, total_duration_sec,
      template:workout_templates(name, training_intent)
    `)
    .eq('status', 'completed')
    .order('started_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data as unknown as GymSession[]) ?? [];
}
