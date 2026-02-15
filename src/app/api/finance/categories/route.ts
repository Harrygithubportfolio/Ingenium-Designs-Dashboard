import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('finance_categories')
    .select('*')
    .eq('is_archived', false)
    .order('sort_order', { ascending: true });

  if (error) return NextResponse.json({ data: null, error: { code: 'QUERY_ERROR', message: error.message } }, { status: 500 });
  return NextResponse.json({ data, error: null });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  }

  const body = await request.json();
  const { name, colour, icon, is_income, budget_monthly } = body;

  if (!name?.trim()) {
    return NextResponse.json({ data: null, error: { code: 'VALIDATION', message: 'Name is required' } }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('finance_categories')
    .insert({
      user_id: user.id,
      name: name.trim(),
      colour: colour || '#3b82f6',
      icon: icon || null,
      is_income: is_income || false,
      budget_monthly: budget_monthly || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ data: null, error: { code: 'INSERT_ERROR', message: error.message } }, { status: 500 });
  return NextResponse.json({ data, error: null }, { status: 201 });
}
