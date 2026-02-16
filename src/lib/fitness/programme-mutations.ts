import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  TrainingProgramme,
  ProgrammeQuestionnaire,
  AiGeneratedPlan,
  ProgrammeStatus,
} from './programme-types';
import type { TrainingIntent } from './types';

export async function createProgramme(
  supabase: SupabaseClient,
  userId: string,
  questionnaire: ProgrammeQuestionnaire,
  plan: AiGeneratedPlan
) {
  // Insert the programme
  const { data: programme, error: pErr } = await supabase
    .from('training_programmes')
    .insert({
      user_id: userId,
      name: plan.programme_name,
      goal: questionnaire.primary_goal,
      duration_weeks: plan.duration_weeks,
      days_per_week: plan.days_per_week,
      experience_level: questionnaire.experience_level,
      equipment_access: questionnaire.equipment_access,
      session_duration_min: questionnaire.session_duration_min,
      questionnaire_responses: questionnaire,
      ai_generated_plan: plan,
      description: plan.description,
      status: 'draft',
    })
    .select()
    .single();
  if (pErr) throw new Error(pErr.message);

  // Insert all programme workouts
  const workouts = plan.weeks.flatMap((week) =>
    week.days.map((day, dayIdx) => ({
      programme_id: programme.id,
      week_number: week.week_number,
      day_number: day.day_number,
      workout_name: day.workout_name,
      training_intent: day.training_intent as TrainingIntent,
      exercises: day.exercises,
      notes: day.notes ?? null,
      sort_order: dayIdx,
    }))
  );

  if (workouts.length > 0) {
    const { error: wErr } = await supabase
      .from('programme_workouts')
      .insert(workouts);
    if (wErr) throw new Error(wErr.message);
  }

  return programme as TrainingProgramme;
}

export async function activateProgramme(
  supabase: SupabaseClient,
  userId: string,
  programmeId: string,
  startDate: string
) {
  // Fetch programme with workouts
  const { data: programme, error: pErr } = await supabase
    .from('training_programmes')
    .select('*, workouts:programme_workouts(*)')
    .eq('id', programmeId)
    .single();
  if (pErr) throw new Error(pErr.message);
  if (!programme) throw new Error('Programme not found');

  const workouts = programme.workouts ?? [];

  // Group workouts by unique workout_name to create templates
  const uniqueWorkouts = new Map<string, typeof workouts[0]>();
  for (const w of workouts) {
    if (!uniqueWorkouts.has(w.workout_name)) {
      uniqueWorkouts.set(w.workout_name, w);
    }
  }

  // Create a template for each unique workout
  const templateMap = new Map<string, string>(); // workout_name -> template_id
  for (const [name, workout] of uniqueWorkouts) {
    const exercises = (workout.exercises as Array<{
      exercise_name: string;
      sets: number;
      reps: string;
      load_suggestion: string;
      rest_seconds: number;
      notes?: string;
    }>) ?? [];

    const { data: template, error: tErr } = await supabase
      .from('workout_templates')
      .insert({
        user_id: userId,
        name: `${programme.name} — ${name}`,
        training_intent: workout.training_intent,
        description: `Auto-generated from programme: ${programme.name}`,
      })
      .select()
      .single();
    if (tErr) throw new Error(tErr.message);

    // Insert template exercises
    const templateExercises = exercises.map((ex, idx) => ({
      template_id: template.id,
      exercise_name: ex.exercise_name,
      sort_order: idx,
      target_sets: ex.sets,
      target_reps: parseInt(ex.reps.split('-')[0], 10) || ex.sets, // use lower bound of range
      target_load_kg: null, // AI gives suggestions like "RPE 7", not exact kg
      notes: [ex.load_suggestion, ex.notes].filter(Boolean).join(' — ') || null,
    }));

    if (templateExercises.length > 0) {
      const { error: eErr } = await supabase
        .from('template_exercises')
        .insert(templateExercises);
      if (eErr) throw new Error(eErr.message);
    }

    templateMap.set(name, template.id);
  }

  // Schedule all workouts
  const start = new Date(startDate);
  const scheduledEntries = [];

  for (const workout of workouts) {
    // Calculate the actual date: start + (week - 1) weeks + (day - 1) days
    const date = new Date(start);
    date.setDate(date.getDate() + (workout.week_number - 1) * 7 + (workout.day_number - 1));
    const dateStr = date.toISOString().split('T')[0];

    const templateId = templateMap.get(workout.workout_name);
    if (!templateId) continue;

    scheduledEntries.push({
      user_id: userId,
      template_id: templateId,
      scheduled_date: dateStr,
      programme_id: programmeId,
    });
  }

  if (scheduledEntries.length > 0) {
    const { error: sErr } = await supabase
      .from('scheduled_workouts')
      .insert(scheduledEntries);
    if (sErr) throw new Error(sErr.message);
  }

  // Update programme status
  const { error: uErr } = await supabase
    .from('training_programmes')
    .update({
      status: 'active',
      activated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', programmeId);
  if (uErr) throw new Error(uErr.message);

  return { templatesCreated: uniqueWorkouts.size, workoutsScheduled: scheduledEntries.length };
}

export async function updateProgrammeStatus(
  supabase: SupabaseClient,
  programmeId: string,
  status: ProgrammeStatus
) {
  const updates: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === 'completed') {
    updates.completed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('training_programmes')
    .update(updates)
    .eq('id', programmeId);
  if (error) throw new Error(error.message);
}

export async function deleteProgramme(supabase: SupabaseClient, programmeId: string) {
  const { error } = await supabase
    .from('training_programmes')
    .delete()
    .eq('id', programmeId);
  if (error) throw new Error(error.message);
}
