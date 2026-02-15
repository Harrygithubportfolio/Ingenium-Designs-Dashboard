import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { fetchIntakeEvents, fetchDailyTargets } from '@/lib/nutrition/queries';
import { getEffectiveValue } from '@/lib/nutrition/types';
import { buildDailySummaryPrompt } from '@/lib/nutrition/ai-summary-prompt';
import { supabase } from '@/lib/supabaseClient';

const MODEL = 'claude-sonnet-4-5-20250929';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, goal_override } = body as { date: string; goal_override?: string };

    if (!date) {
      return NextResponse.json(
        { data: null, error: { code: 'VALIDATION', message: 'date is required' } },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { data: null, error: { code: 'CONFIG_ERROR', message: 'AI is not configured' } },
        { status: 503 }
      );
    }

    // Fetch today's data
    const [events, targets] = await Promise.all([
      fetchIntakeEvents(date),
      fetchDailyTargets(date),
    ]);

    if (events.length === 0) {
      return NextResponse.json({
        data: {
          summary: 'No meals have been logged today yet. Start tracking to get personalized feedback!',
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

    const { system, user } = buildDailySummaryPrompt({
      meals,
      consumed,
      targets: defaultTargets,
      goals,
      goalOverride: goal_override,
    });

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 512,
      system,
      messages: [{ role: 'user', content: user }],
    });

    const textBlock = message.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text response from Claude');
    }

    let parsed: { summary: string; rating: string; tips: string[] };
    try {
      parsed = JSON.parse(textBlock.text);
    } catch {
      const jsonMatch = textBlock.text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Failed to parse AI summary response');
      }
    }

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
