import { supabase } from '@/lib/supabaseClient';
import type {
  IntakeEvent,
  DailyNutritionTarget,
  NutritionReflection,
  DailySummary,
  MacroTotals,
} from './types';
import { getEffectiveValue } from './types';

export async function fetchIntakeEvents(date: string) {
  const startOfDay = `${date}T00:00:00`;
  const endOfDay = `${date}T23:59:59`;

  const { data, error } = await supabase
    .from('intake_events')
    .select('*, items:intake_items(*)')
    .gte('event_timestamp', startOfDay)
    .lte('event_timestamp', endOfDay)
    .order('event_timestamp', { ascending: true });
  if (error) throw new Error(error.message);
  return (data as IntakeEvent[]) ?? [];
}

export async function fetchDailyTargets(date: string) {
  const { data, error } = await supabase
    .from('daily_nutrition_targets')
    .select('*')
    .eq('target_date', date)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as DailyNutritionTarget | null;
}

export async function fetchNutritionReflection(date: string) {
  const { data, error } = await supabase
    .from('nutrition_reflections')
    .select('*')
    .eq('reflection_date', date)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as NutritionReflection | null;
}

export async function computeDailySummary(date: string): Promise<DailySummary> {
  const [events, targets] = await Promise.all([
    fetchIntakeEvents(date),
    fetchDailyTargets(date),
  ]);

  const consumed: MacroTotals = { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };

  for (const event of events) {
    for (const item of event.items ?? []) {
      consumed.calories += getEffectiveValue(item.estimated_calories, item.edited_calories);
      consumed.protein_g += getEffectiveValue(item.estimated_protein_g, item.edited_protein_g);
      consumed.carbs_g += getEffectiveValue(item.estimated_carbs_g, item.edited_carbs_g);
      consumed.fat_g += getEffectiveValue(item.estimated_fat_g, item.edited_fat_g);
    }
  }

  const defaultTargets: MacroTotals = {
    calories: targets?.target_calories ?? 2400,
    protein_g: targets?.target_protein_g ?? 180,
    carbs_g: targets?.target_carbs_g ?? 300,
    fat_g: targets?.target_fat_g ?? 80,
  };

  const remaining: MacroTotals = {
    calories: Math.max(0, defaultTargets.calories - consumed.calories),
    protein_g: Math.max(0, defaultTargets.protein_g - consumed.protein_g),
    carbs_g: Math.max(0, defaultTargets.carbs_g - consumed.carbs_g),
    fat_g: Math.max(0, defaultTargets.fat_g - consumed.fat_g),
  };

  const totalMacroGrams = consumed.protein_g + consumed.carbs_g + consumed.fat_g;

  return {
    date,
    targets: defaultTargets,
    consumed,
    remaining,
    meal_count: events.length,
    macro_distribution: {
      protein_pct: totalMacroGrams > 0 ? Math.round((consumed.protein_g / totalMacroGrams) * 100) : 0,
      carbs_pct: totalMacroGrams > 0 ? Math.round((consumed.carbs_g / totalMacroGrams) * 100) : 0,
      fat_pct: totalMacroGrams > 0 ? Math.round((consumed.fat_g / totalMacroGrams) * 100) : 0,
    },
  };
}
