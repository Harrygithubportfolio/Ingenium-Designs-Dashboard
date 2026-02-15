import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
  const { data, error } = await supabase
    .from('gym_sessions')
    .select('*, exercises:execution_exercises(*, sets:execution_sets(*))')
    .in('status', ['active', 'paused'])
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ data: null, error: { code: 'QUERY_ERROR', message: error.message } }, { status: 500 });
  return NextResponse.json({ data, error: null });
}
