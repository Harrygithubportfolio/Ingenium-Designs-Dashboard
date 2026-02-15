import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateEvent, deleteEvent } from '@/lib/calendar/mutations';
import { fetchEventById } from '@/lib/calendar/queries';
import { pushToGoogle } from '@/lib/calendar/sync';
import type { CalendarEventInput } from '@/lib/calendar/types';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  }

  const { id } = await params;
  const body: Partial<CalendarEventInput> = await request.json();

  try {
    const data = await updateEvent(supabase, id, body);

    // If this event is synced with Google, push the update
    if (data.google_event_id) {
      try {
        await pushToGoogle(user.id, data, 'update', supabase);
      } catch (syncErr) {
        console.error('Push update to Google failed (non-blocking):', syncErr);
      }
    }

    return NextResponse.json({ data, error: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ data: null, error: { code: 'UPDATE_ERROR', message } }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Fetch event before deleting to check if it needs Google sync
    const event = await fetchEventById(supabase, id);

    await deleteEvent(supabase, id);

    // If synced with Google, delete there too
    if (event.google_event_id) {
      try {
        await pushToGoogle(user.id, event, 'delete', supabase);
      } catch (syncErr) {
        console.error('Push delete to Google failed (non-blocking):', syncErr);
      }
    }

    return NextResponse.json({ data: null, error: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ data: null, error: { code: 'DELETE_ERROR', message } }, { status: 500 });
  }
}
