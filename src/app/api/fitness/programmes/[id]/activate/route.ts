import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { activateProgramme } from '@/lib/fitness/programme-mutations';

export async function POST(
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
    const body = await request.json();
    const startDate = body.start_date as string;

    if (!startDate) {
      return NextResponse.json(
        { data: null, error: { code: 'VALIDATION', message: 'start_date is required (YYYY-MM-DD)' } },
        { status: 400 }
      );
    }

    const result = await activateProgramme(supabase, user.id, id, startDate);
    return NextResponse.json({ data: result, error: null });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error activating programme';
    console.error('Programme activation error:', err);
    return NextResponse.json(
      { data: null, error: { code: 'ACTIVATION_ERROR', message } },
      { status: 500 }
    );
  }
}
