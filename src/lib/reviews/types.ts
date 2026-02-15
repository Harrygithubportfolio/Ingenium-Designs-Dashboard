export type PeriodType = 'weekly' | 'monthly';

export interface ReviewMetrics {
  fitness: {
    workouts_planned: number;
    workouts_completed: number;
    total_volume_kg: number;
    workout_adherence_pct: number;
  };
  nutrition: {
    avg_calories: number;
    avg_protein_g: number;
    days_logged: number;
  };
  habits: {
    total_completions: number;
    completion_rate_pct: number;
    best_streak: { name: string; days: number } | null;
  };
  sleep: {
    avg_hours: number;
    avg_quality: number;
    days_logged: number;
  };
  hydration: {
    avg_ml: number;
    target_hit_days: number;
    days_logged: number;
  };
  focus: {
    total_minutes: number;
    sessions_completed: number;
  };
  goals: {
    active: number;
    completed: number;
  };
}

export interface ReviewSnapshot {
  id: string;
  user_id: string;
  period_type: PeriodType;
  period_start: string;
  period_end: string;
  metrics: ReviewMetrics;
  ai_summary: string | null;
  is_viewed: boolean;
  created_at: string;
}
