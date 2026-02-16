// ============================================
// FITNESS SYSTEM — TYPE DEFINITIONS
// ============================================

// --- Enums ---

export type TrainingIntent = 'strength' | 'hypertrophy' | 'recovery' | 'conditioning';

export type ScheduledWorkoutStatus = 'scheduled' | 'completed' | 'missed' | 'rescheduled';

export type GymModeStatus = 'active' | 'paused' | 'completed' | 'abandoned';

export type SessionRating = 'strong' | 'normal' | 'off';

// --- Workout Templates (Planning Layer) ---

export interface TemplateExercise {
  id: string;
  template_id: string;
  exercise_name: string;
  sort_order: number;
  target_sets: number;
  target_reps: number;
  target_load_kg: number | null;
  target_rpe: number | null;
  notes: string | null;
  created_at: string;
}

export interface WorkoutTemplate {
  id: string;
  user_id: string;
  name: string;
  training_intent: TrainingIntent;
  description: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  exercises?: TemplateExercise[];
}

// --- Scheduled Workouts (Commitment Layer) ---

export interface ScheduledWorkout {
  id: string;
  user_id: string;
  template_id: string;
  scheduled_date: string;
  status: ScheduledWorkoutStatus;
  rescheduled_to: string | null;
  rescheduled_from_id: string | null;
  programme_id?: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  template?: WorkoutTemplate;
}

// --- Gym Sessions (Execution Layer) ---

export interface ExecutionSet {
  id: string;
  execution_exercise_id: string;
  set_number: number;
  actual_weight_kg: number;
  actual_reps: number;
  notes: string | null;
  logged_at: string;
}

export interface ExecutionExercise {
  id: string;
  gym_session_id: string;
  template_exercise_id: string | null;
  exercise_name: string;
  sort_order: number;
  was_skipped: boolean;
  is_additional: boolean;
  created_at: string;
  sets?: ExecutionSet[];
  // For comparison display
  target_sets?: number;
  target_reps?: number;
  target_load_kg?: number | null;
}

export interface GymSession {
  id: string;
  user_id: string;
  scheduled_workout_id: string | null;
  template_id: string | null;
  status: GymModeStatus;
  started_at: string;
  ended_at: string | null;
  total_duration_sec: number | null;
  total_volume_kg: number | null;
  created_at: string;
  // Joined fields
  exercises?: ExecutionExercise[];
  template?: WorkoutTemplate;
}

// --- Workout Reflections (Reflection Layer) ---

export interface PersonalRecord {
  exercise: string;
  metric: 'weight' | 'reps' | 'volume';
  value: number;
  previous_value: number;
}

export interface MissedTarget {
  exercise: string;
  target_sets: number;
  actual_sets: number;
  target_reps: number;
  actual_reps: number;
}

export interface WorkoutReflection {
  id: string;
  user_id: string;
  gym_session_id: string;
  session_rating: SessionRating | null;
  reflection_note: string | null;
  planned_volume_kg: number | null;
  executed_volume_kg: number | null;
  volume_delta_pct: number | null;
  personal_records: PersonalRecord[];
  missed_targets: MissedTarget[];
  created_at: string;
  updated_at: string;
}

// --- Input Types ---

export interface CreateTemplateInput {
  name: string;
  training_intent: TrainingIntent;
  description?: string;
  exercises: {
    exercise_name: string;
    sort_order: number;
    target_sets: number;
    target_reps: number;
    target_load_kg?: number;
    target_rpe?: number;
    notes?: string;
  }[];
}

export interface LogSetInput {
  execution_exercise_id: string;
  actual_weight_kg: number;
  actual_reps: number;
  notes?: string;
}

export interface ReflectionInput {
  session_rating?: SessionRating;
  reflection_note?: string;
}

// --- Display Helpers ---

export const TRAINING_INTENT_LABELS: Record<TrainingIntent, string> = {
  strength: 'Strength',
  hypertrophy: 'Hypertrophy',
  recovery: 'Recovery',
  conditioning: 'Conditioning',
};

export const TRAINING_INTENT_COLORS: Record<TrainingIntent, string> = {
  strength: 'text-red-400 bg-red-400/10',
  hypertrophy: 'text-purple-400 bg-purple-400/10',
  recovery: 'text-green-400 bg-green-400/10',
  conditioning: 'text-amber-400 bg-amber-400/10',
};

export const SESSION_RATING_LABELS: Record<SessionRating, string> = {
  strong: 'Strong',
  normal: 'Normal',
  off: 'Off',
};

export const WORKOUT_STATUS_COLORS: Record<ScheduledWorkoutStatus, string> = {
  scheduled: 'text-blue-400 bg-blue-400/10',
  completed: 'text-green-400 bg-green-400/10',
  missed: 'text-red-400 bg-red-400/10',
  rescheduled: 'text-amber-400 bg-amber-400/10',
};
