import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  IntakeEvent,
  IntakeItem,
  MealType,
  ManualIntakeInput,
  EditIntakeItemInput,
  DailyTargetInput,
  NutritionReflection,
  NutritionReflectionInput,
} from './types';
import type { AiEstimatedItem } from './ai-types';
import { computeDailySummary } from './queries';

// --- Intake Events ---

export async function createManualIntake(supabase: SupabaseClient, userId: string, input: ManualIntakeInput) {
  const { data: event, error: eErr } = await supabase
    .from('intake_events')
    .insert({
      user_id: userId,
      intake_method: 'manual',
      meal_type: input.meal_type,
      notes: input.notes ?? null,
    })
    .select()
    .single();
  if (eErr) throw new Error(eErr.message);

  const items = input.items.map((item) => ({
    intake_event_id: event.id,
    food_name: item.food_name,
    portion_description: item.portion_description ?? null,
    portion_grams: item.portion_grams ?? null,
    estimated_calories: item.calories,
    estimated_protein_g: item.protein_g,
    estimated_carbs_g: item.carbs_g,
    estimated_fat_g: item.fat_g,
    confidence_score: 1.0, // manual entries get full confidence
    was_edited: false,
  }));

  const { error: iErr } = await supabase.from('intake_items').insert(items);
  if (iErr) throw new Error(iErr.message);

  return event as IntakeEvent;
}

export async function editIntakeItem(supabase: SupabaseClient, itemId: string, input: EditIntakeItemInput) {
  const updates: Record<string, unknown> = {
    was_edited: true,
    updated_at: new Date().toISOString(),
  };

  if (input.calories !== undefined) updates.edited_calories = input.calories;
  if (input.protein_g !== undefined) updates.edited_protein_g = input.protein_g;
  if (input.carbs_g !== undefined) updates.edited_carbs_g = input.carbs_g;
  if (input.fat_g !== undefined) updates.edited_fat_g = input.fat_g;
  if (input.portion_grams !== undefined) updates.edited_portion_grams = input.portion_grams;

  const { data, error } = await supabase
    .from('intake_items')
    .update(updates)
    .eq('id', itemId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as IntakeItem;
}

export async function deleteIntakeEvent(supabase: SupabaseClient, eventId: string) {
  const { error } = await supabase
    .from('intake_events')
    .delete()
    .eq('id', eventId);
  if (error) throw new Error(error.message);
}

// --- Daily Targets ---

export async function upsertDailyTargets(supabase: SupabaseClient, userId: string, input: DailyTargetInput) {
  const { data, error } = await supabase
    .from('daily_nutrition_targets')
    .upsert(
      {
        user_id: userId,
        target_date: input.target_date,
        day_type: input.day_type,
        target_calories: input.target_calories,
        target_protein_g: input.target_protein_g,
        target_carbs_g: input.target_carbs_g,
        target_fat_g: input.target_fat_g,
        source: 'manual',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,target_date' }
    )
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// --- Reflections ---

export async function createNutritionReflection(supabase: SupabaseClient, userId: string, input: NutritionReflectionInput) {
  const summary = await computeDailySummary(supabase, input.date);

  // Compute adherence
  const calorieAdherence = summary.targets.calories > 0
    ? (summary.consumed.calories / summary.targets.calories) * 100
    : 0;
  const proteinAdherence = summary.targets.protein_g > 0
    ? (summary.consumed.protein_g / summary.targets.protein_g) * 100
    : 0;
  const carbsAdherence = summary.targets.carbs_g > 0
    ? (summary.consumed.carbs_g / summary.targets.carbs_g) * 100
    : 0;
  const fatAdherence = summary.targets.fat_g > 0
    ? (summary.consumed.fat_g / summary.targets.fat_g) * 100
    : 0;

  const avgAdherence = (calorieAdherence + proteinAdherence + carbsAdherence + fatAdherence) / 4;

  // Find largest deviation
  const deviations = [
    { name: 'Calories', delta: Math.abs(summary.consumed.calories - summary.targets.calories), unit: 'kcal' },
    { name: 'Protein', delta: Math.abs(summary.consumed.protein_g - summary.targets.protein_g), unit: 'g' },
    { name: 'Carbs', delta: Math.abs(summary.consumed.carbs_g - summary.targets.carbs_g), unit: 'g' },
    { name: 'Fat', delta: Math.abs(summary.consumed.fat_g - summary.targets.fat_g), unit: 'g' },
  ];
  const largest = deviations.sort((a, b) => b.delta - a.delta)[0];
  const largestDir = largest.name === 'Calories'
    ? (summary.consumed.calories > summary.targets.calories ? 'over' : 'under')
    : (summary.consumed[`${largest.name.toLowerCase()}_g` as keyof typeof summary.consumed] > summary.targets[`${largest.name.toLowerCase()}_g` as keyof typeof summary.targets] ? 'over' : 'under');

  const { data, error } = await supabase
    .from('nutrition_reflections')
    .upsert(
      {
        user_id: userId,
        reflection_date: input.date,
        total_calories: summary.consumed.calories,
        total_protein_g: summary.consumed.protein_g,
        total_carbs_g: summary.consumed.carbs_g,
        total_fat_g: summary.consumed.fat_g,
        adherence_score: parseFloat(Math.min(100, avgAdherence).toFixed(1)),
        largest_deviation: `${largest.name} ${largestDir} by ${Math.round(largest.delta)}${largest.unit}`,
        macro_distribution: summary.macro_distribution,
        reflection_note: input.reflection_note ?? null,
        hunger_level: input.hunger_level ?? null,
        social_eating_flag: input.social_eating_flag ?? false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,reflection_date' }
    )
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as NutritionReflection;
}

// --- AI Text Intake ---

export interface AiTextIntakeInput {
  meal_type: MealType;
  items: AiEstimatedItem[];
  raw_description: string;
  notes?: string;
}

export async function createAiTextIntake(supabase: SupabaseClient, userId: string, input: AiTextIntakeInput) {
  const { data: event, error: eErr } = await supabase
    .from('intake_events')
    .insert({
      user_id: userId,
      intake_method: 'ai_text',
      meal_type: input.meal_type,
      notes: input.raw_description + (input.notes ? `\n---\n${input.notes}` : ''),
    })
    .select()
    .single();
  if (eErr) throw new Error(eErr.message);

  const items = input.items.map((item) => ({
    intake_event_id: event.id,
    food_name: item.food_name,
    portion_description: item.portion_description ?? null,
    portion_grams: item.portion_grams ?? null,
    estimated_calories: item.calories,
    estimated_protein_g: item.protein_g,
    estimated_carbs_g: item.carbs_g,
    estimated_fat_g: item.fat_g,
    confidence_score: item.confidence_score,
    was_edited: false,
  }));

  const { error: iErr } = await supabase.from('intake_items').insert(items);
  if (iErr) throw new Error(iErr.message);

  return event as IntakeEvent;
}

// --- Backfill AI Estimates ---

export async function backfillAiEstimates(
  supabase: SupabaseClient,
  updates: {
    item_id: string;
    estimated_calories: number;
    estimated_protein_g: number;
    estimated_carbs_g: number;
    estimated_fat_g: number;
    confidence_score: number;
  }[]
) {
  for (const u of updates) {
    const { error } = await supabase
      .from('intake_items')
      .update({
        estimated_calories: u.estimated_calories,
        estimated_protein_g: u.estimated_protein_g,
        estimated_carbs_g: u.estimated_carbs_g,
        estimated_fat_g: u.estimated_fat_g,
        confidence_score: u.confidence_score,
        updated_at: new Date().toISOString(),
      })
      .eq('id', u.item_id);
    if (error) throw new Error(error.message);
  }
}
