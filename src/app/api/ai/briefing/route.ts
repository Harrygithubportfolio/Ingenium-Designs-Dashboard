import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateDailyBriefing } from '@/lib/ai/briefing';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  }

  const date = request.nextUrl.searchParams.get('date') || new Date().toISOString().slice(0, 10);
  const regenerate = request.nextUrl.searchParams.get('regenerate') === 'true';

  try {
    // If regenerate, delete cached version first
    if (regenerate) {
      await supabase
        .from('daily_briefings')
        .delete()
        .eq('user_id', user.id)
        .eq('briefing_date', date)
        .eq('briefing_type', 'morning');
    }

    const result = await generateDailyBriefing(supabase, user.id, date);
    return NextResponse.json({ data: result, error: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error generating briefing';
    return NextResponse.json({ data: null, error: { code: 'GENERATION_ERROR', message } }, { status: 500 });
  }
}
