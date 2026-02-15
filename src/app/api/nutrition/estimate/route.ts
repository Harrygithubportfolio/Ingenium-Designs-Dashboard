import { NextRequest, NextResponse } from 'next/server';
import { estimateMealFromText } from '@/lib/nutrition/estimate';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { description, meal_type } = body;

    if (!description?.trim()) {
      return NextResponse.json(
        {
          data: null,
          error: { code: 'VALIDATION', message: 'description is required' },
        },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'CONFIG_ERROR',
            message:
              'AI estimation is not configured. Add ANTHROPIC_API_KEY to .env.local',
          },
        },
        { status: 503 }
      );
    }

    const result = await estimateMealFromText({
      description: description.trim(),
      meal_type,
    });

    return NextResponse.json({ data: result, error: null });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Unknown estimation error';
    console.error('Estimation error:', err);
    return NextResponse.json(
      {
        data: null,
        error: { code: 'ESTIMATION_ERROR', message },
      },
      { status: 500 }
    );
  }
}
