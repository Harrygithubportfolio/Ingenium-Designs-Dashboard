import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { isAiConfigured } from '@/lib/ai/provider';
import { estimateMealFromText } from '@/lib/nutrition/estimate';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
      { status: 401 }
    );
  }

  const { allowed, retryAfterMs } = checkRateLimit(user.id);
  if (!allowed) {
    return NextResponse.json(
      { data: null, error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) } }
    );
  }

  try {
    const body = await request.json();
    const { description, meal_type } = body;

    if (!description?.trim()) {
      return NextResponse.json(
        { data: null, error: { code: 'VALIDATION', message: 'description is required' } },
        { status: 400 }
      );
    }

    if (!isAiConfigured()) {
      return NextResponse.json(
        { data: null, error: { code: 'CONFIG_ERROR', message: 'AI estimation is not configured. Set AI_PROVIDER and the corresponding API key.' } },
        { status: 503 }
      );
    }

    const result = await estimateMealFromText({
      description: description.trim(),
      meal_type,
    });

    return NextResponse.json({ data: result, error: null });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown estimation error';
    console.error('Estimation error:', err);
    return NextResponse.json(
      { data: null, error: { code: 'ESTIMATION_ERROR', message } },
      { status: 500 }
    );
  }
}
