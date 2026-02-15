// ============================================
// NUTRITION SYSTEM — TYPE DEFINITIONS
// ============================================

// --- Enums ---

export type IntakeMethod = 'photo' | 'manual';

export type MealType =
  | 'breakfast'
  | 'morning_snack'
  | 'lunch'
  | 'afternoon_snack'
  | 'dinner'
  | 'evening_snack'
  | 'other';

export type HungerLevel =
  | 'not_hungry'
  | 'slightly_hungry'
  | 'hungry'
  | 'very_hungry'
  | 'starving';

export type DayType = 'training' | 'rest' | 'active_recovery';

// --- Intake Events (Reality Layer) ---

export interface IntakeItem {
  id: string;
  intake_event_id: string;
  food_name: string;
  portion_description: string | null;
  portion_grams: number | null;
  // Original AI estimates (never modified)
  estimated_calories: number | null;
  estimated_protein_g: number | null;
  estimated_carbs_g: number | null;
  estimated_fat_g: number | null;
  confidence_score: number | null;
  // User-edited values (null if unedited)
  edited_calories: number | null;
  edited_protein_g: number | null;
  edited_carbs_g: number | null;
  edited_fat_g: number | null;
  edited_portion_grams: number | null;
  was_edited: boolean;
  created_at: string;
  updated_at: string;
}

export interface IntakeEvent {
  id: string;
  user_id: string;
  intake_method: IntakeMethod;
  meal_type: MealType;
  event_timestamp: string;
  photo_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items?: IntakeItem[];
}

// --- Effective values (COALESCE of edited over estimated) ---

export interface EffectiveIntakeItem {
  id: string;
  intake_event_id: string;
  food_name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  portion_grams: number | null;
  confidence_score: number | null;
  was_edited: boolean;
  // Originals for comparison when edited
  original_calories: number | null;
  original_protein_g: number | null;
  original_carbs_g: number | null;
  original_fat_g: number | null;
}

// --- Daily Nutrition Targets (Intent Layer) ---

export interface DailyNutritionTarget {
  id: string;
  user_id: string;
  target_date: string;
  day_type: DayType;
  target_calories: number;
  target_protein_g: number;
  target_carbs_g: number;
  target_fat_g: number;
  source: 'manual' | 'ai_suggested' | 'rule_based';
  ai_reasoning: string | null;
  is_accepted: boolean;
  created_at: string;
  updated_at: string;
}

// --- Daily Summary (Computed) ---

export interface MacroTotals {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface DailySummary {
  date: string;
  targets: MacroTotals;
  consumed: MacroTotals;
  remaining: MacroTotals;
  meal_count: number;
  macro_distribution: {
    protein_pct: number;
    carbs_pct: number;
    fat_pct: number;
  };
}

// --- Nutrition Reflections ---

export interface NutritionReflection {
  id: string;
  user_id: string;
  reflection_date: string;
  total_calories: number | null;
  total_protein_g: number | null;
  total_carbs_g: number | null;
  total_fat_g: number | null;
  adherence_score: number | null;
  largest_deviation: string | null;
  macro_distribution: { protein_pct: number; carbs_pct: number; fat_pct: number } | null;
  ai_summary: string | null;
  reflection_note: string | null;
  hunger_level: HungerLevel | null;
  social_eating_flag: boolean;
  created_at: string;
  updated_at: string;
}

// --- Input Types ---

export interface ManualIntakeInput {
  meal_type: MealType;
  items: {
    food_name: string;
    portion_description?: string;
    portion_grams?: number;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  }[];
  notes?: string;
}

export interface EditIntakeItemInput {
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  portion_grams?: number;
}

export interface NutritionReflectionInput {
  date: string;
  reflection_note?: string;
  hunger_level?: HungerLevel;
  social_eating_flag?: boolean;
}

export interface DailyTargetInput {
  target_date: string;
  day_type: DayType;
  target_calories: number;
  target_protein_g: number;
  target_carbs_g: number;
  target_fat_g: number;
}

// --- Display Helpers ---

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  morning_snack: 'Morning Snack',
  lunch: 'Lunch',
  afternoon_snack: 'Afternoon Snack',
  dinner: 'Dinner',
  evening_snack: 'Evening Snack',
  other: 'Other',
};

export const MEAL_TYPE_ICONS: Record<MealType, string> = {
  breakfast: '☀',
  morning_snack: '🌤',
  lunch: '☀',
  afternoon_snack: '🌤',
  dinner: '🌙',
  evening_snack: '🌙',
  other: '🍽',
};

export const HUNGER_LEVEL_LABELS: Record<HungerLevel, string> = {
  not_hungry: 'Not Hungry',
  slightly_hungry: 'Slightly',
  hungry: 'Hungry',
  very_hungry: 'Very Hungry',
  starving: 'Starving',
};

export const DAY_TYPE_LABELS: Record<DayType, string> = {
  training: 'Training Day',
  rest: 'Rest Day',
  active_recovery: 'Active Recovery',
};

export function getConfidenceStars(score: number | null): number {
  if (score === null) return 0;
  if (score >= 0.9) return 5;
  if (score >= 0.7) return 4;
  if (score >= 0.5) return 3;
  if (score >= 0.3) return 2;
  return 1;
}

export function getEffectiveValue(estimated: number | null, edited: number | null): number {
  return edited ?? estimated ?? 0;
}
