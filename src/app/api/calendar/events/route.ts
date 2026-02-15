import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchEvents, fetchConnection, fetchEventById } from '@/lib/calendar/queries';
import { createEvent } from '@/lib/calendar/mutations';
import { pushToGoogle } from '@/lib/calendar/sync';
import type { CalendarEventInput } from '@/lib/calendar/types';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  }

  const from = request.nextUrl.searchParams.get('from');
  const to = request.nextUrl.searchParams.get('to');

  if (!from || !to) {
    return NextResponse.json({ data: null, error: { code: 'VALIDATION', message: 'from and to dates required' } }, { status: 400 });
  }

  try {
    const data = await fetchEvents(supabase, from, to);
    return NextResponse.json({ data, error: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ data: null, error: { code: 'QUERY_ERROR', message } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  }

  const body: CalendarEventInput = await request.json();

  if (!body.title || !body.event_date) {
    return NextResponse.json({ data: null, error: { code: 'VALIDATION', message: 'title and event_date required' } }, { status: 400 });
  }

  try {
    const data = await createEvent(supabase, user.id, body);

    // If user wants to sync to Google and has an active connection
    if (body.sync_to_google) {
      const connection = await fetchConnection(supabase);
      if (connection) {
        try {
          const fullEvent = await fetchEventById(supabase, data.id);
          await pushToGoogle(user.id, fullEvent, 'create', supabase);
        } catch (syncErr) {
          console.error('Push to Google failed (non-blocking):', syncErr);
        }
      }
    }

    return NextResponse.json({ data, error: null }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ data: null, error: { code: 'INSERT_ERROR', message } }, { status: 500 });
  }
}
