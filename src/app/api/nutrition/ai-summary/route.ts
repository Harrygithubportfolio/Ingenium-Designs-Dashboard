import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { getAiProvider, isAiConfigured } from '@/lib/ai/provider';
import { parseAiJson } from '@/lib/ai/parse-json';
import { fetchIntakeEvents, fetchDailyTargets } from '@/lib/nutrition/queries';
import { getEffectiveValue } from '@/lib/nutrition/types';
import { buildDailySummaryPrompt } from '@/lib/nutrition/ai-summary-prompt';

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
    const { date, goal_override } = body as { date: string; goal_override?: string };

    if (!date) {
      return NextResponse.json(
        { data: null, error: { code: 'VALIDATION', message: 'date is required' } },
        { status: 400 }
      );
    }

    if (!isAiConfigured()) {
      return NextResponse.json(
        { data: null, error: { code: 'CONFIG_ERROR', message: 'AI is not configured. Set AI_PROVIDER and the corresponding API key.' } },
        { status: 503 }
      );
    }

    // Fetch today's data
    const [events, targets] = await Promise.all([
      fetchIntakeEvents(supabase, date),
      fetchDailyTargets(supabase, date),
    ]);

    if (events.length === 0) {
      return NextResponse.json({
        data: {
          summary: 'No meals have been logged today yet. Start tracking to get personalised feedback!',
          rating: 'needs_work',
          tips: ['Log your meals throughout the day for accurate tracking', 'Start with breakfast to build the habit'],
        },
        error: null,
      });
    }

    // Compute consumed totals
    const consumed = { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };
    for (const event of events) {
      for (const item of event.items ?? []) {
        consumed.calories += getEffectiveValue(item.estimated_calories, item.edited_calories);
        consumed.protein_g += getEffectiveValue(item.estimated_protein_g, item.edited_protein_g);
        consumed.carbs_g += getEffectiveValue(item.estimated_carbs_g, item.edited_carbs_g);
        consumed.fat_g += getEffectiveValue(item.estimated_fat_g, item.edited_fat_g);
      }
    }

    const defaultTargets = {
      calories: targets?.target_calories ?? 2400,
      protein_g: targets?.target_protein_g ?? 180,
      carbs_g: targets?.target_carbs_g ?? 300,
      fat_g: targets?.target_fat_g ?? 80,
    };

    // Fetch active goals
    const { data: goalsData } = await supabase
      .from('goals')
      .select('title, description')
      .eq('status', 'active');
    const goals = (goalsData ?? []) as { title: string; description: string | null }[];

    // Build meals summary for the prompt
    const meals = events.map((e) => ({
      meal_type: e.meal_type,
      items: (e.items ?? []).map((i) => ({
        food_name: i.food_name,
        calories: getEffectiveValue(i.estimated_calories, i.edited_calories),
        protein_g: getEffectiveValue(i.estimated_protein_g, i.edited_protein_g),
        carbs_g: getEffectiveValue(i.estimated_carbs_g, i.edited_carbs_g),
        fat_g: getEffectiveValue(i.estimated_fat_g, i.edited_fat_g),
      })),
    }));

    const { system, user: userPrompt } = buildDailySummaryPrompt({
      meals,
      consumed,
      targets: defaultTargets,
      goals,
      goalOverride: goal_override,
    });

    const provider = getAiProvider();
    const result = await provider.complete({
      prompt: { system, user: userPrompt },
      maxTokens: 512,
      jsonMode: true,
    });

    const parsed = parseAiJson<{ summary: string; rating: string; tips: string[] }>(
      result.text
    );

    return NextResponse.json({ data: parsed, error: null });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown summary error';
    console.error('AI summary error:', err);
    return NextResponse.json(
      { data: null, error: { code: 'SUMMARY_ERROR', message } },
      { status: 500 }
    );
  }
}
