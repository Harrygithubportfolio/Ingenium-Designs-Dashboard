import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { computeDailySummary } from '@/lib/nutrition/queries';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  }

  const date = request.nextUrl.searchParams.get('date') ?? new Date().toISOString().split('T')[0];
  try {
    const summary = await computeDailySummary(supabase, date);
    return NextResponse.json({ data: summary, error: null });
  } catch (err: any) {
    return NextResponse.json({ data: null, error: { code: 'COMPUTE_ERROR', message: err.message } }, { status: 500 });
  }
}
