import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  }

  const from = request.nextUrl.searchParams.get('from');
  const to = request.nextUrl.searchParams.get('to');

  let query = supabase
    .from('finance_transactions')
    .select('*, category:finance_categories(*)')
    .order('transaction_date', { ascending: false });

  if (from) query = query.gte('transaction_date', from);
  if (to) query = query.lte('transaction_date', to);

  const { data, error } = await query;
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
  const { amount, description, category_id, is_income, transaction_date, notes, is_recurring } = body;

  if (!amount || !description?.trim()) {
    return NextResponse.json({ data: null, error: { code: 'VALIDATION', message: 'Amount and description are required' } }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('finance_transactions')
    .insert({
      user_id: user.id,
      amount,
      description: description.trim(),
      category_id: category_id || null,
      is_income: is_income || false,
      transaction_date: transaction_date || new Date().toISOString().slice(0, 10),
      notes: notes || null,
      is_recurring: is_recurring || false,
    })
    .select('*, category:finance_categories(*)')
    .single();

  if (error) return NextResponse.json({ data: null, error: { code: 'INSERT_ERROR', message: error.message } }, { status: 500 });
  return NextResponse.json({ data, error: null }, { status: 201 });
}
