import type { SupabaseClient } from '@supabase/supabase-js';
import type { CalendarEvent, CalendarEventInput } from './types';

export async function createEvent(
  supabase: SupabaseClient,
  userId: string,
  input: CalendarEventInput
): Promise<CalendarEvent> {
  const { data, error } = await supabase
    .from('calendar_events')
    .insert({
      user_id: userId,
      source: 'local',
      title: input.title,
      description: input.description ?? null,
      event_date: input.event_date,
      start_time: input.start_time ?? null,
      end_time: input.end_time ?? null,
      location: input.location ?? null,
      is_all_day: input.is_all_day ?? false,
      category: input.category ?? 'general',
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as CalendarEvent;
}

export async function updateEvent(
  supabase: SupabaseClient,
  eventId: string,
  input: Partial<CalendarEventInput>
): Promise<CalendarEvent> {
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.title !== undefined) updates.title = input.title;
  if (input.description !== undefined) updates.description = input.description;
  if (input.event_date !== undefined) updates.event_date = input.event_date;
  if (input.start_time !== undefined) updates.start_time = input.start_time;
  if (input.end_time !== undefined) updates.end_time = input.end_time;
  if (input.location !== undefined) updates.location = input.location;
  if (input.is_all_day !== undefined) updates.is_all_day = input.is_all_day;
  if (input.category !== undefined) updates.category = input.category;

  const { data, error } = await supabase
    .from('calendar_events')
    .update(updates)
    .eq('id', eventId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as CalendarEvent;
}

export async function deleteEvent(
  supabase: SupabaseClient,
  eventId: string
): Promise<void> {
  // Soft-delete: set is_deleted = true (needed for sync to propagate deletion to Google)
  const { error } = await supabase
    .from('calendar_events')
    .update({ is_deleted: true, updated_at: new Date().toISOString() })
    .eq('id', eventId);
  if (error) throw new Error(error.message);
}

export async function disconnectGoogle(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('calendar_connections')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('provider', 'google');
  if (error) throw new Error(error.message);
}
