import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (body.is_processed !== undefined) updates.is_processed = body.is_processed;
  if (body.is_processed) updates.processed_at = new Date().toISOString();
  if (body.routed_to !== undefined) updates.routed_to = body.routed_to;
  if (body.routed_id !== undefined) updates.routed_id = body.routed_id;
  if (body.content !== undefined) updates.content = body.content;
  if (body.item_type !== undefined) updates.item_type = body.item_type;

  const { data, error } = await supabase
    .from('inbox_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ data: null, error: { code: 'UPDATE_ERROR', message: error.message } }, { status: 500 });
  return NextResponse.json({ data, error: null });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  }

  const { id } = await params;
  const { error } = await supabase.from('inbox_items').delete().eq('id', id);
  if (error) return NextResponse.json({ data: null, error: { code: 'DELETE_ERROR', message: error.message } }, { status: 500 });
  return NextResponse.json({ data: { id }, error: null });
}
