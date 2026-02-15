import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { aggregateMetrics } from '@/lib/reviews/aggregator';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  }

  const periodType = request.nextUrl.searchParams.get('period') || 'weekly';
  const from = request.nextUrl.searchParams.get('from');
  const to = request.nextUrl.searchParams.get('to');
  const regenerate = request.nextUrl.searchParams.get('regenerate') === 'true';

  if (!from || !to) {
    return NextResponse.json({ data: null, error: { code: 'VALIDATION', message: 'from and to are required' } }, { status: 400 });
  }

  // Check for cached review
  if (!regenerate) {
    const { data: cached } = await supabase
      .from('review_snapshots')
      .select('*')
      .eq('user_id', user.id)
      .eq('period_type', periodType)
      .eq('period_start', from)
      .maybeSingle();

    if (cached) {
      return NextResponse.json({ data: cached, error: null });
    }
  }

  // Generate new review
  try {
    const metrics = await aggregateMetrics(supabase, user.id, from, to);

    const { data: snapshot, error } = await supabase
      .from('review_snapshots')
      .upsert(
        {
          user_id: user.id,
          period_type: periodType,
          period_start: from,
          period_end: to,
          metrics,
        },
        { onConflict: 'user_id,period_type,period_start' },
      )
      .select()
      .single();

    if (error) return NextResponse.json({ data: null, error: { code: 'UPSERT_ERROR', message: error.message } }, { status: 500 });
    return NextResponse.json({ data: snapshot, error: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ data: null, error: { code: 'AGGREGATION_ERROR', message } }, { status: 500 });
  }
}
