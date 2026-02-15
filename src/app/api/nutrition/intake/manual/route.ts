import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { meal_type, items, notes } = body;

  if (!meal_type || !items?.length) {
    return NextResponse.json({ data: null, error: { code: 'VALIDATION', message: 'meal_type and items required' } }, { status: 400 });
  }

  const { data: event, error: eErr } = await supabase
    .from('intake_events')
    .insert({ intake_method: 'manual', meal_type, notes: notes ?? null })
    .select()
    .single();
  if (eErr) return NextResponse.json({ data: null, error: { code: 'INSERT_ERROR', message: eErr.message } }, { status: 500 });

  const itemRows = items.map((item: any) => ({
    intake_event_id: event.id,
    food_name: item.food_name,
    portion_description: item.portion_description ?? null,
    portion_grams: item.portion_grams ?? null,
    estimated_calories: item.calories,
    estimated_protein_g: item.protein_g,
    estimated_carbs_g: item.carbs_g,
    estimated_fat_g: item.fat_g,
    confidence_score: 1.0,
    was_edited: false,
  }));

  const { error: iErr } = await supabase.from('intake_items').insert(itemRows);
  if (iErr) return NextResponse.json({ data: null, error: { code: 'INSERT_ERROR', message: iErr.message } }, { status: 500 });

  return NextResponse.json({ data: event, error: null }, { status: 201 });
}
