// ============================================
// SETTINGS SYSTEM — TYPE DEFINITIONS
// ============================================

import type { TrainingIntent } from '@/lib/fitness/types';
import type { MealType } from '@/lib/nutrition/types';
import type { AiProviderName } from '@/lib/ai/types';

// --- Enums / Unions ---

export type WeightUnit = 'kg' | 'lbs';
export type TemperatureUnit = 'celsius' | 'fahrenheit';
export type WindSpeedUnit = 'kmh' | 'mph' | 'ms';
export type MeasurementSystem = 'metric' | 'imperial';
export type ThemeMode = 'dark' | 'light' | 'system';
export type AccentColour =
  | '#3b82f6'   // Blue (default)
  | '#8b5cf6'   // Purple
  | '#10b981'   // Emerald
  | '#f59e0b'   // Amber
  | '#ef4444'   // Red
  | '#ec4899'   // Pink
  | '#06b6d4'   // Cyan
  | '#f97316';  // Orange

// --- Per-Section Settings ---

export interface ProfileSettings {
  display_name: string;
  avatar_url: string | null;
  onboarding_completed: boolean;
}

export interface AppearanceSettings {
  theme: ThemeMode;
  accent_colour: AccentColour;
}

export interface FitnessSettings {
  default_weight_unit: WeightUnit;
  default_rest_timer_seconds: number;
  auto_advance_exercise: boolean;
  default_training_intent: TrainingIntent;
}

export interface NutritionSettings {
  default_meal_type: MealType;
  preferred_ai_provider: AiProviderName;
  measurement_system: MeasurementSystem;
}

export interface WeatherSettings {
  location_name: string;
  latitude: string;
  longitude: string;
  temperature_unit: TemperatureUnit;
  wind_speed_unit: WindSpeedUnit;
}

export interface CalendarSettings {
  sync_frequency_minutes: number;
  default_event_duration_minutes: number;
}

export interface FocusSettings {
  morning_start_hour: number;
  evening_start_hour: number;
}

export interface NotificationSettings {
  workout_reminders: boolean;
  meal_logging_reminders: boolean;
  goal_deadlines: boolean;
  daily_focus_prompts: boolean;
}

// --- Combined Settings Object ---

export interface UserSettings {
  profile: ProfileSettings;
  appearance: AppearanceSettings;
  fitness: FitnessSettings;
  nutrition: NutritionSettings;
  weather: WeatherSettings;
  calendar: CalendarSettings;
  focus: FocusSettings;
  notifications: NotificationSettings;
}

// --- Database Row ---

export interface UserSettingsRow {
  id: string;
  user_id: string;
  settings: UserSettings;
  created_at: string;
  updated_at: string;
}

// --- Defaults ---

export const DEFAULT_SETTINGS: UserSettings = {
  profile: {
    display_name: '',
    avatar_url: null,
    onboarding_completed: false,
  },
  appearance: {
    theme: 'dark',
    accent_colour: '#3b82f6',
  },
  fitness: {
    default_weight_unit: 'kg',
    default_rest_timer_seconds: 90,
    auto_advance_exercise: false,
    default_training_intent: 'hypertrophy',
  },
  nutrition: {
    default_meal_type: 'lunch',
    preferred_ai_provider: 'gemini',
    measurement_system: 'metric',
  },
  weather: {
    location_name: '',
    latitude: '',
    longitude: '',
    temperature_unit: 'celsius',
    wind_speed_unit: 'kmh',
  },
  calendar: {
    sync_frequency_minutes: 30,
    default_event_duration_minutes: 60,
  },
  focus: {
    morning_start_hour: 5,
    evening_start_hour: 18,
  },
  notifications: {
    workout_reminders: true,
    meal_logging_reminders: false,
    goal_deadlines: true,
    daily_focus_prompts: true,
  },
};

// --- Settings Section Keys for Navigation ---

export type SettingsSection =
  | 'profile'
  | 'appearance'
  | 'fitness'
  | 'nutrition'
  | 'weather'
  | 'calendar'
  | 'focus'
  | 'notifications'
  | 'integrations'
  | 'data-privacy'
  | 'account';

export interface SettingsSectionMeta {
  id: SettingsSection;
  label: string;
  description: string;
}

export const SETTINGS_SECTIONS: SettingsSectionMeta[] = [
  { id: 'profile', label: 'Profile', description: 'Display name and avatar' },
  { id: 'appearance', label: 'Appearance', description: 'Theme and accent colour' },
  { id: 'fitness', label: 'Fitness & Gym', description: 'Weight units, rest timer, training defaults' },
  { id: 'nutrition', label: 'Nutrition', description: 'Meal types, AI provider, units' },
  { id: 'weather', label: 'Weather', description: 'Location and temperature units' },
  { id: 'calendar', label: 'Calendar', description: 'Sync and event defaults' },
  { id: 'focus', label: 'Focus', description: 'Morning and evening session times' },
  { id: 'notifications', label: 'Notifications', description: 'Reminders and prompts' },
  { id: 'integrations', label: 'Integrations', description: 'Connected services' },
  { id: 'data-privacy', label: 'Data & Privacy', description: 'Export, clear data, policies' },
  { id: 'account', label: 'Account', description: 'Sign out and account management' },
];

// --- Accent Colour Display Helpers ---

export const ACCENT_COLOUR_LABELS: Record<AccentColour, string> = {
  '#3b82f6': 'Blue',
  '#8b5cf6': 'Purple',
  '#10b981': 'Emerald',
  '#f59e0b': 'Amber',
  '#ef4444': 'Red',
  '#ec4899': 'Pink',
  '#06b6d4': 'Cyan',
  '#f97316': 'Orange',
};

// Darker hover variants for each accent
export const ACCENT_COLOUR_HOVER: Record<AccentColour, string> = {
  '#3b82f6': '#2563eb',
  '#8b5cf6': '#7c3aed',
  '#10b981': '#059669',
  '#f59e0b': '#d97706',
  '#ef4444': '#dc2626',
  '#ec4899': '#db2777',
  '#06b6d4': '#0891b2',
  '#f97316': '#ea580c',
};

// --- Apply Accent Colour to CSS Variables ---

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

export function applyAccentColour(hex: AccentColour) {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;
  const { r, g, b } = hexToRgb(hex);
  const hover = ACCENT_COLOUR_HOVER[hex] || hex;

  root.style.setProperty('--accent', hex);
  root.style.setProperty('--accent-hover', hover);
  root.style.setProperty('--accent-subtle', `rgba(${r}, ${g}, ${b}, 0.1)`);
  root.style.setProperty('--accent-glow', `rgba(${r}, ${g}, ${b}, 0.15)`);
  root.style.setProperty('--color-accent', hex);
  root.style.setProperty('--color-accent-hover', hover);
}

export function applyTheme(theme: ThemeMode) {
  if (typeof window === 'undefined') return;
  document.documentElement.setAttribute('data-theme', theme);
}
