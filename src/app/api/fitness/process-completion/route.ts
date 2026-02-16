import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { processWorkoutCompletion } from '@/lib/fitness/gamification-engine';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
      { status: 401 }
    );
  }

  try {
    const { session_id } = (await request.json()) as { session_id: string };

    if (!session_id) {
      return NextResponse.json(
        { data: null, error: { code: 'VALIDATION', message: 'session_id is required' } },
        { status: 400 }
      );
    }

    const result = await processWorkoutCompletion(supabase, user.id, session_id);
    return NextResponse.json({ data: result, error: null });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error processing workout completion';
    console.error('Process completion error:', err);
    return NextResponse.json(
      { data: null, error: { code: 'PROCESSING_ERROR', message } },
      { status: 500 }
    );
  }
}
