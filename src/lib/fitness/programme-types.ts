// ============================================
// TRAINING PROGRAMMES — TYPE DEFINITIONS
// ============================================

import type { TrainingIntent } from './types';

// --- Questionnaire ---

export type ProgrammeGoal =
  | 'lose_weight'
  | 'build_muscle'
  | 'improve_strength'
  | 'general_fitness'
  | 'sport_specific';

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

export type EquipmentAccess = 'full_gym' | 'home_gym' | 'bodyweight_only';

export type SessionDuration = 30 | 45 | 60 | 90;

export interface ProgrammeQuestionnaire {
  age: number;
  experience_level: ExperienceLevel;
  primary_goal: ProgrammeGoal;
  days_per_week: number;
  session_duration_min: SessionDuration;
  equipment_access: EquipmentAccess;
  injuries_limitations: string;
  current_bodyweight_kg?: number;
  current_lifts?: {
    squat_kg?: number;
    bench_kg?: number;
    deadlift_kg?: number;
    overhead_press_kg?: number;
  };
}

// --- Programme Status ---

export type ProgrammeStatus = 'draft' | 'active' | 'completed' | 'abandoned';

// --- Programme Exercise (stored as JSONB in programme_workouts) ---

export interface ProgrammeExercise {
  exercise_name: string;
  sets: number;
  reps: string;              // e.g. "8-12" or "5"
  load_suggestion: string;   // e.g. "70% 1RM" or "RPE 7"
  rest_seconds: number;
  notes?: string;
  superset_group?: string;   // group letter (A, B, etc.) for supersets
}

// --- Programme Workout (DB row) ---

export interface ProgrammeWorkout {
  id: string;
  programme_id: string;
  week_number: number;
  day_number: number;
  workout_name: string;
  training_intent: TrainingIntent;
  exercises: ProgrammeExercise[];
  notes?: string;
  sort_order: number;
  created_at: string;
}

// --- Training Programme (DB row) ---

export interface TrainingProgramme {
  id: string;
  user_id: string;
  name: string;
  goal: ProgrammeGoal;
  duration_weeks: number;
  days_per_week: number;
  experience_level: ExperienceLevel;
  equipment_access: EquipmentAccess;
  session_duration_min: number;
  questionnaire_responses: ProgrammeQuestionnaire;
  ai_generated_plan: AiGeneratedPlan;
  description: string | null;
  status: ProgrammeStatus;
  activated_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  workouts?: ProgrammeWorkout[];
}

// --- AI-Generated Plan (stored as JSONB) ---

export interface AiGeneratedPlan {
  programme_name: string;
  description: string;
  duration_weeks: number;
  days_per_week: number;
  training_split: string;
  progression_notes: string;
  weeks: AiPlanWeek[];
}

export interface AiPlanWeek {
  week_number: number;
  focus: string;
  days: AiPlanDay[];
}

export interface AiPlanDay {
  day_number: number;
  workout_name: string;
  training_intent: TrainingIntent;
  exercises: ProgrammeExercise[];
  notes?: string;
}

// --- Display Helpers ---

export const PROGRAMME_GOAL_LABELS: Record<ProgrammeGoal, string> = {
  lose_weight: 'Lose Weight',
  build_muscle: 'Build Muscle',
  improve_strength: 'Improve Strength',
  general_fitness: 'General Fitness',
  sport_specific: 'Sport-Specific',
};

export const PROGRAMME_GOAL_COLORS: Record<ProgrammeGoal, string> = {
  lose_weight: 'text-green-400 bg-green-400/10',
  build_muscle: 'text-purple-400 bg-purple-400/10',
  improve_strength: 'text-red-400 bg-red-400/10',
  general_fitness: 'text-blue-400 bg-blue-400/10',
  sport_specific: 'text-amber-400 bg-amber-400/10',
};

export const EXPERIENCE_LEVEL_LABELS: Record<ExperienceLevel, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export const EQUIPMENT_ACCESS_LABELS: Record<EquipmentAccess, string> = {
  full_gym: 'Full Gym',
  home_gym: 'Home Gym',
  bodyweight_only: 'Bodyweight Only',
};

export const PROGRAMME_STATUS_LABELS: Record<ProgrammeStatus, string> = {
  draft: 'Draft',
  active: 'Active',
  completed: 'Completed',
  abandoned: 'Abandoned',
};

export const PROGRAMME_STATUS_COLORS: Record<ProgrammeStatus, string> = {
  draft: 'text-amber-400 bg-amber-400/10',
  active: 'text-green-400 bg-green-400/10',
  completed: 'text-blue-400 bg-blue-400/10',
  abandoned: 'text-red-400 bg-red-400/10',
};
