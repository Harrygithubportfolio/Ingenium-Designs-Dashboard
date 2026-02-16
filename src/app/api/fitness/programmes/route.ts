import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchProgrammes } from '@/lib/fitness/programme-queries';
import type { ProgrammeStatus } from '@/lib/fitness/programme-types';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as ProgrammeStatus | null;
    const programmes = await fetchProgrammes(supabase, status ?? undefined);
    return NextResponse.json({ data: programmes, error: null });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error fetching programmes';
    return NextResponse.json(
      { data: null, error: { code: 'FETCH_ERROR', message } },
      { status: 500 }
    );
  }
}
