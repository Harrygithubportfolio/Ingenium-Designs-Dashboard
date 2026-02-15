/**
 * Server-only: Two-way sync engine for Google Calendar.
 * Pull = Google → local Supabase. Push = local → Google.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { calendar_v3 } from 'googleapis';
import { getGoogleCalendarClient } from './google-client';
import type { CalendarEvent, SyncResult } from './types';

// ==================
// PULL: Google → Local
// ==================

function extractTime(dateTime: string): string {
  // "2026-02-15T09:00:00+00:00" → "09:00"
  const match = dateTime.match(/T(\d{2}:\d{2})/);
  return match ? match[1] : '00:00';
}

function mapGoogleEventToLocal(
  gEvent: calendar_v3.Schema$Event,
  userId: string
): Partial<CalendarEvent> {
  const isAllDay = !!gEvent.start?.date;
  const eventDate = gEvent.start?.date || gEvent.start?.dateTime?.split('T')[0] || '';
  const startTime = gEvent.start?.dateTime ? extractTime(gEvent.start.dateTime) : null;
  const endTime = gEvent.end?.dateTime ? extractTime(gEvent.end.dateTime) : null;

  return {
    user_id: userId,
    source: 'google',
    google_event_id: gEvent.id ?? undefined,
    title: gEvent.summary || 'Untitled',
    description: gEvent.description || null,
    event_date: eventDate,
    start_time: startTime,
    end_time: endTime,
    location: gEvent.location || null,
    is_all_day: isAllDay,
    google_etag: gEvent.etag || null,
  };
}

export async function pullFromGoogle(
  userId: string,
  supabase: SupabaseClient
): Promise<SyncResult> {
  const result: SyncResult = { pulled: 0, pushed: 0, conflicts: 0, errors: [] };

  const { calendar, connection } = await getGoogleCalendarClient(userId, supabase);

  try {
    const params: calendar_v3.Params$Resource$Events$List = {
      calendarId: connection.calendar_id || 'primary',
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 2500,
    };

    if (connection.sync_token) {
      // Incremental sync
      params.syncToken = connection.sync_token;
    } else {
      // Full sync: past 3 months to future 6 months
      const now = new Date();
      const timeMin = new Date(now);
      timeMin.setMonth(timeMin.getMonth() - 3);
      const timeMax = new Date(now);
      timeMax.setMonth(timeMax.getMonth() + 6);
      params.timeMin = timeMin.toISOString();
      params.timeMax = timeMax.toISOString();
    }

    let nextPageToken: string | undefined;
    let newSyncToken: string | undefined;

    do {
      if (nextPageToken) params.pageToken = nextPageToken;

      let response;
      try {
        response = await calendar.events.list(params);
      } catch (err: unknown) {
        // If syncToken is invalid, do a full sync
        if (
          err &&
          typeof err === 'object' &&
          'code' in err &&
          (err as { code: number }).code === 410
        ) {
          // Clear sync token and retry with full sync
          await supabase
            .from('calendar_connections')
            .update({ sync_token: null })
            .eq('id', connection.id);
          return pullFromGoogle(userId, supabase);
        }
        throw err;
      }

      const events = response.data.items || [];

      for (const gEvent of events) {
        if (!gEvent.id) continue;

        const isCancelled = gEvent.status === 'cancelled';

        // Check if we already have this event locally
        const { data: existing } = await supabase
          .from('calendar_events')
          .select('id, google_etag')
          .eq('user_id', userId)
          .eq('google_event_id', gEvent.id)
          .maybeSingle();

        if (isCancelled) {
          if (existing) {
            await supabase
              .from('calendar_events')
              .update({ is_deleted: true, updated_at: new Date().toISOString() })
              .eq('id', existing.id);
            result.pulled++;
          }
          continue;
        }

        const localData = mapGoogleEventToLocal(gEvent, userId);

        if (existing) {
          // Update if etag changed
          if (existing.google_etag !== gEvent.etag) {
            await supabase
              .from('calendar_events')
              .update({
                ...localData,
                is_deleted: false,
                last_synced_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq('id', existing.id);
            result.pulled++;
          }
        } else {
          // Insert new event
          await supabase.from('calendar_events').insert({
            ...localData,
            last_synced_at: new Date().toISOString(),
          });
          result.pulled++;
        }
      }

      nextPageToken = response.data.nextPageToken ?? undefined;
      newSyncToken = response.data.nextSyncToken ?? undefined;
    } while (nextPageToken);

    // Save sync token for next incremental sync
    if (newSyncToken) {
      await supabase
        .from('calendar_connections')
        .update({
          sync_token: newSyncToken,
          last_synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', connection.id);
    }

    // Log success
    await supabase.from('calendar_sync_log').insert({
      user_id: userId,
      direction: 'pull',
      status: 'success',
      events_processed: result.pulled,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown pull sync error';
    result.errors.push(message);
    await supabase.from('calendar_sync_log').insert({
      user_id: userId,
      direction: 'pull',
      status: 'error',
      error_message: message,
    });
  }

  return result;
}

// ==================
// PUSH: Local → Google
// ==================

function mapLocalToGoogleEvent(
  event: CalendarEvent
): calendar_v3.Schema$Event {
  const gEvent: calendar_v3.Schema$Event = {
    summary: event.title,
    description: event.description || undefined,
    location: event.location || undefined,
  };

  if (event.is_all_day) {
    gEvent.start = { date: event.event_date };
    // Google all-day end date is exclusive (next day)
    const endDate = new Date(event.event_date);
    endDate.setDate(endDate.getDate() + 1);
    gEvent.end = { date: endDate.toISOString().split('T')[0] };
  } else {
    const startDT = `${event.event_date}T${event.start_time || '00:00'}:00`;
    const endDT = `${event.event_date}T${event.end_time || event.start_time || '01:00'}:00`;
    gEvent.start = { dateTime: startDT };
    gEvent.end = { dateTime: endDT };
  }

  return gEvent;
}

export async function pushToGoogle(
  userId: string,
  event: CalendarEvent,
  action: 'create' | 'update' | 'delete',
  supabase: SupabaseClient
): Promise<void> {
  const { calendar, connection } = await getGoogleCalendarClient(userId, supabase);
  const calendarId = connection.calendar_id || 'primary';

  try {
    if (action === 'create') {
      const gEvent = mapLocalToGoogleEvent(event);
      const response = await calendar.events.insert({
        calendarId,
        requestBody: gEvent,
      });

      // Update local event with Google IDs
      await supabase
        .from('calendar_events')
        .update({
          google_event_id: response.data.id,
          google_etag: response.data.etag,
          source: 'google', // Now it's synced
          last_synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', event.id);
    } else if (action === 'update' && event.google_event_id) {
      const gEvent = mapLocalToGoogleEvent(event);
      const response = await calendar.events.update({
        calendarId,
        eventId: event.google_event_id,
        requestBody: gEvent,
      });

      await supabase
        .from('calendar_events')
        .update({
          google_etag: response.data.etag,
          last_synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', event.id);
    } else if (action === 'delete' && event.google_event_id) {
      await calendar.events.delete({
        calendarId,
        eventId: event.google_event_id,
      });
    }

    await supabase.from('calendar_sync_log').insert({
      user_id: userId,
      direction: 'push',
      status: 'success',
      events_processed: 1,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown push sync error';
    await supabase.from('calendar_sync_log').insert({
      user_id: userId,
      direction: 'push',
      status: 'error',
      error_message: message,
    });
    throw err;
  }
}
