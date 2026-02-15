// ==================
// Calendar Event (unified — local + Google)
// ==================

export interface CalendarEvent {
  id: string;
  user_id: string;
  source: 'local' | 'google';
  google_event_id: string | null;
  title: string;
  description: string | null;
  event_date: string;       // YYYY-MM-DD
  start_time: string | null; // HH:MM
  end_time: string | null;   // HH:MM
  location: string | null;
  is_all_day: boolean;
  category: string;
  colour: string | null;
  google_etag: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

// ==================
// Calendar Connection (OAuth — tokens omitted on client)
// ==================

export interface CalendarConnection {
  id: string;
  user_id: string;
  provider: 'google';
  calendar_id: string;
  last_synced_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ==================
// Input types
// ==================

export interface CalendarEventInput {
  title: string;
  description?: string;
  event_date: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  is_all_day?: boolean;
  category?: string;
  sync_to_google?: boolean;
}

// ==================
// Sync result
// ==================

export interface SyncResult {
  pulled: number;
  pushed: number;
  conflicts: number;
  errors: string[];
}
