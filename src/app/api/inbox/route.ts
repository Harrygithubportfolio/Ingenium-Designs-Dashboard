import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  }

  const unprocessedOnly = request.nextUrl.searchParams.get('unprocessed') === 'true';

  let query = supabase
    .from('inbox_items')
    .select('*')
    .order('created_at', { ascending: false });

  if (unprocessedOnly) {
    query = query.eq('is_processed', false);
  }

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
  const { content, item_type } = body;

  if (!content?.trim()) {
    return NextResponse.json({ data: null, error: { code: 'VALIDATION', message: 'Content is required' } }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('inbox_items')
    .insert({ user_id: user.id, content: content.trim(), item_type: item_type || 'thought' })
    .select()
    .single();

  if (error) return NextResponse.json({ data: null, error: { code: 'INSERT_ERROR', message: error.message } }, { status: 500 });
  return NextResponse.json({ data, error: null }, { status: 201 });
}
