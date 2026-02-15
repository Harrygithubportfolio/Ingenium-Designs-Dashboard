import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  }

  const date = request.nextUrl.searchParams.get('date') ?? new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('daily_nutrition_targets')
    .select('*')
    .eq('target_date', date)
    .maybeSingle();

  if (error) return NextResponse.json({ data: null, error: { code: 'QUERY_ERROR', message: error.message } }, { status: 500 });
  return NextResponse.json({ data, error: null });
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  }

  const body = await request.json();
  const { target_date, day_type, target_calories, target_protein_g, target_carbs_g, target_fat_g } = body;

  if (!target_date || target_calories == null) {
    return NextResponse.json({ data: null, error: { code: 'VALIDATION', message: 'Missing required fields' } }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('daily_nutrition_targets')
    .upsert({
      user_id: user.id,
      target_date,
      day_type: day_type ?? 'rest',
      target_calories,
      target_protein_g: target_protein_g ?? 0,
      target_carbs_g: target_carbs_g ?? 0,
      target_fat_g: target_fat_g ?? 0,
      source: 'manual',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,target_date' })
    .select()
    .single();

  if (error) return NextResponse.json({ data: null, error: { code: 'UPSERT_ERROR', message: error.message } }, { status: 500 });
  return NextResponse.json({ data, error: null });
}
