export interface SleepLog {
  id: string;
  user_id: string;
  log_date: string;
  hours_slept: number;
  quality: number; // 1-5
  bed_time: string | null;
  wake_time: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SleepLogInput {
  hours_slept: number;
  quality: number;
  bed_time?: string | null;
  wake_time?: string | null;
  notes?: string | null;
}

export interface HydrationEntry {
  time: string; // HH:MM
  ml: number;
}

export interface HydrationLog {
  id: string;
  user_id: string;
  log_date: string;
  total_ml: number;
  target_ml: number;
  entries: HydrationEntry[];
  created_at: string;
  updated_at: string;
}

export interface HydrationLogInput {
  total_ml: number;
  target_ml?: number;
  entries: HydrationEntry[];
}
