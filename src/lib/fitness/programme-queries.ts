import type { SupabaseClient } from '@supabase/supabase-js';
import type { TrainingProgramme, ProgrammeWorkout, ProgrammeStatus } from './programme-types';

export async function fetchProgrammes(
  supabase: SupabaseClient,
  status?: ProgrammeStatus
) {
  let query = supabase
    .from('training_programmes')
    .select('*')
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as TrainingProgramme[]) ?? [];
}

export async function fetchProgramme(supabase: SupabaseClient, id: string) {
  const { data, error } = await supabase
    .from('training_programmes')
    .select('*, workouts:programme_workouts(*)')
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  return data as TrainingProgramme;
}

export async function fetchProgrammeWorkouts(
  supabase: SupabaseClient,
  programmeId: string,
  weekNumber?: number
) {
  let query = supabase
    .from('programme_workouts')
    .select('*')
    .eq('programme_id', programmeId)
    .order('week_number', { ascending: true })
    .order('day_number', { ascending: true });

  if (weekNumber) {
    query = query.eq('week_number', weekNumber);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as ProgrammeWorkout[]) ?? [];
}
