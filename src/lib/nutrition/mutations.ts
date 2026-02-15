import { supabase } from '@/lib/supabaseClient';
import { getUserId } from '@/lib/getUserId';
import type {
  IntakeEvent,
  IntakeItem,
  ManualIntakeInput,
  EditIntakeItemInput,
  DailyTargetInput,
  NutritionReflection,
  NutritionReflectionInput,
} from './types';
import { computeDailySummary } from './queries';

// --- Intake Events ---

export async function createManualIntake(input: ManualIntakeInput) {
  const userId = await getUserId();

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

export async function editIntakeItem(itemId: string, input: EditIntakeItemInput) {
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

export async function deleteIntakeEvent(eventId: string) {
  const { error } = await supabase
    .from('intake_events')
    .delete()
    .eq('id', eventId);
  if (error) throw new Error(error.message);
}

// --- Daily Targets ---

export async function upsertDailyTargets(input: DailyTargetInput) {
  const userId = await getUserId();

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

export async function createNutritionReflection(input: NutritionReflectionInput) {
  const userId = await getUserId();
  const summary = await computeDailySummary(input.date);

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
