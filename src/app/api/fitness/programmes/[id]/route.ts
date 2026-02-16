import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchProgramme } from '@/lib/fitness/programme-queries';
import { updateProgrammeStatus, deleteProgramme } from '@/lib/fitness/programme-mutations';
import type { ProgrammeStatus } from '@/lib/fitness/programme-types';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;
    const programme = await fetchProgramme(supabase, id);
    return NextResponse.json({ data: programme, error: null });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error fetching programme';
    return NextResponse.json(
      { data: null, error: { code: 'FETCH_ERROR', message } },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;
    const { status } = (await request.json()) as { status: ProgrammeStatus };
    await updateProgrammeStatus(supabase, id, status);
    return NextResponse.json({ data: { success: true }, error: null });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error updating programme';
    return NextResponse.json(
      { data: null, error: { code: 'UPDATE_ERROR', message } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;
    await deleteProgramme(supabase, id);
    return NextResponse.json({ data: { success: true }, error: null });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error deleting programme';
    return NextResponse.json(
      { data: null, error: { code: 'DELETE_ERROR', message } },
      { status: 500 }
    );
  }
}
