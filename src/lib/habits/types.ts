export type HabitFrequency = 'daily' | 'weekdays' | 'weekends' | 'custom';
export type AutoSource = 'workout_logged' | 'meals_logged' | 'sleep_logged' | 'hydration_target' | 'focus_session' | null;

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  colour: string;
  icon: string | null;
  frequency: HabitFrequency;
  custom_days: number[] | null; // ISO weekday 1=Mon..7=Sun
  auto_source: AutoSource;
  is_archived: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface HabitCompletion {
  id: string;
  habit_id: string;
  completion_date: string;
  completed_by: 'manual' | 'auto';
  notes: string | null;
  created_at: string;
}

export interface HabitInput {
  name: string;
  description?: string | null;
  colour?: string;
  icon?: string | null;
  frequency?: HabitFrequency;
  custom_days?: number[] | null;
  auto_source?: AutoSource;
}

export interface HabitWithStats extends Habit {
  currentStreak: number;
  bestStreak: number;
  completedToday: boolean;
}
