import { NextRequest, NextResponse } from 'next/server';
import { computeDailySummary } from '@/lib/nutrition/queries';

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get('date') ?? new Date().toISOString().split('T')[0];
  try {
    const summary = await computeDailySummary(date);
    return NextResponse.json({ data: summary, error: null });
  } catch (err: any) {
    return NextResponse.json({ data: null, error: { code: 'COMPUTE_ERROR', message: err.message } }, { status: 500 });
  }
}
