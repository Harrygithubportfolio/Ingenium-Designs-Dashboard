import type { SupabaseClient } from '@supabase/supabase-js';
import type { CalendarEvent, CalendarConnection } from './types';

export async function fetchEvents(
  supabase: SupabaseClient,
  from: string,
  to: string
): Promise<CalendarEvent[]> {
  const { data, error } = await supabase
    .from('calendar_events')
    .select('*')
    .gte('event_date', from)
    .lte('event_date', to)
    .eq('is_deleted', false)
    .order('event_date', { ascending: true })
    .order('start_time', { ascending: true });
  if (error) throw new Error(error.message);
  return (data as CalendarEvent[]) ?? [];
}

export async function fetchEventById(
  supabase: SupabaseClient,
  id: string
): Promise<CalendarEvent> {
  const { data, error } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  return data as CalendarEvent;
}

export async function fetchConnection(
  supabase: SupabaseClient
): Promise<CalendarConnection | null> {
  const { data, error } = await supabase
    .from('calendar_connections')
    .select('id, user_id, provider, calendar_id, last_synced_at, is_active, created_at, updated_at')
    .eq('provider', 'google')
    .eq('is_active', true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as CalendarConnection | null;
}
