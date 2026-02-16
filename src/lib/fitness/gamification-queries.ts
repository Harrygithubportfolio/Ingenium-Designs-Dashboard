import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  FitnessProfile,
  PersonalRecordDB,
  FitnessXPLog,
  FitnessAchievement,
} from './gamification-types';

export async function fetchFitnessProfile(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('fitness_profiles')
    .select('*')
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as FitnessProfile | null;
}

export async function fetchPersonalRecords(
  supabase: SupabaseClient,
  exerciseName?: string
) {
  let query = supabase
    .from('personal_records')
    .select('*')
    .order('achieved_at', { ascending: false });

  if (exerciseName) {
    query = query.ilike('exercise_name', exerciseName);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as PersonalRecordDB[]) ?? [];
}

export async function fetchLatestPRsByExercise(supabase: SupabaseClient) {
  // Get the latest PR of each type for each exercise
  const { data, error } = await supabase
    .from('personal_records')
    .select('*')
    .order('achieved_at', { ascending: false });
  if (error) throw new Error(error.message);

  // Deduplicate: keep only the latest per exercise+record_type
  const seen = new Set<string>();
  const latest: PersonalRecordDB[] = [];
  for (const pr of (data ?? []) as PersonalRecordDB[]) {
    const key = `${pr.exercise_name}::${pr.record_type}`;
    if (!seen.has(key)) {
      seen.add(key);
      latest.push(pr);
    }
  }

  return latest;
}

export async function fetchRecentXP(supabase: SupabaseClient, days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from('fitness_xp_log')
    .select('*')
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data as FitnessXPLog[]) ?? [];
}

export async function fetchAchievements(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('fitness_achievements')
    .select('*')
    .order('unlocked_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data as FitnessAchievement[]) ?? [];
}

export async function fetchPRCount(supabase: SupabaseClient) {
  const { count, error } = await supabase
    .from('personal_records')
    .select('*', { count: 'exact', head: true });
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function fetchWorkoutStats(
  supabase: SupabaseClient,
  periodDays = 30
) {
  const since = new Date();
  since.setDate(since.getDate() - periodDays);

  const { data, error } = await supabase
    .from('gym_sessions')
    .select('id, total_volume_kg, total_duration_sec, started_at')
    .eq('status', 'completed')
    .gte('started_at', since.toISOString())
    .order('started_at', { ascending: false });
  if (error) throw new Error(error.message);

  const sessions = data ?? [];
  return {
    workoutCount: sessions.length,
    totalVolume: sessions.reduce((sum, s) => sum + (s.total_volume_kg ?? 0), 0),
    totalDuration: sessions.reduce((sum, s) => sum + (s.total_duration_sec ?? 0), 0),
    sessions,
  };
}
