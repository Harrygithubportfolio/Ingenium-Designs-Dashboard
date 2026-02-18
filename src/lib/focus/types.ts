// ============================================
// Focus Types — Supabase-backed
// ============================================

export interface FocusTask {
  id: string;
  title: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  source?: 'goal' | 'manual';
  goalId?: string;
  milestoneId?: string;
}

export interface DailyFocus {
  id: string;
  date: string;
  primaryFocus: string;
  primaryFocusCompleted: boolean;
  supportingTasks: FocusTask[];
  intentionNote?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Reflection {
  id: string;
  date: string;
  wentWell: string;
  challenges: string;
  improvements: string;
  gratitude?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface WellnessCheck {
  id: string;
  checkDate: string;
  checkType: 'mood' | 'stretch' | 'breathing' | 'meditation';
  moodScore?: number;
  notes?: string;
  createdAt: string;
}

// ============================================
// Supabase Row Types (snake_case)
// ============================================

export interface DailyFocusRow {
  id: string;
  user_id: string;
  focus_date: string;
  primary_focus: string;
  primary_focus_completed: boolean;
  supporting_tasks: FocusTask[];
  intention_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReflectionRow {
  id: string;
  user_id: string;
  reflect_date: string;
  went_well: string;
  challenges: string;
  improvements: string;
  gratitude: string | null;
  created_at: string;
  updated_at: string;
}

export interface WellnessCheckRow {
  id: string;
  user_id: string;
  check_date: string;
  check_type: string;
  mood_score: number | null;
  notes: string | null;
  created_at: string;
}

// ============================================
// Mappers
// ============================================

export function toClientFocus(row: DailyFocusRow): DailyFocus {
  return {
    id: row.id,
    date: row.focus_date,
    primaryFocus: row.primary_focus,
    primaryFocusCompleted: row.primary_focus_completed,
    supportingTasks: row.supporting_tasks ?? [],
    intentionNote: row.intention_note ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toClientReflection(row: ReflectionRow): Reflection {
  return {
    id: row.id,
    date: row.reflect_date,
    wentWell: row.went_well,
    challenges: row.challenges,
    improvements: row.improvements,
    gratitude: row.gratitude ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toClientWellnessCheck(row: WellnessCheckRow): WellnessCheck {
  return {
    id: row.id,
    checkDate: row.check_date,
    checkType: row.check_type as WellnessCheck['checkType'],
    moodScore: row.mood_score ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
  };
}
