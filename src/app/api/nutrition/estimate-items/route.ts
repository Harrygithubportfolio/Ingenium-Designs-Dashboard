import { NextRequest, NextResponse } from 'next/server';
import { estimateMealFromText } from '@/lib/nutrition/estimate';
import { backfillAiEstimates } from '@/lib/nutrition/mutations';

interface ItemInput {
  id: string;
  food_name: string;
  portion_description: string | null;
  portion_grams: number | null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items } = body as { items: ItemInput[] };

    if (!items?.length) {
      return NextResponse.json(
        { data: null, error: { code: 'VALIDATION', message: 'items array is required' } },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { data: null, error: { code: 'CONFIG_ERROR', message: 'AI estimation is not configured' } },
        { status: 503 }
      );
    }

    // Build a description string from the food items
    const description = items
      .map((i) => {
        const portion = i.portion_grams ? `${i.portion_grams}g ` : '';
        const desc = i.portion_description ? ` (${i.portion_description})` : '';
        return `${portion}${i.food_name}${desc}`;
      })
      .join(', ');

    const result = await estimateMealFromText({ description });

    // Map AI results back to item IDs by matching food names
    const data = items.map((item, idx) => {
      // Try to find a matching result by index (AI returns in same order)
      const aiItem = result.items[idx] ?? result.items[0];
      return {
        item_id: item.id,
        calories: aiItem?.calories ?? 0,
        protein_g: aiItem?.protein_g ?? 0,
        carbs_g: aiItem?.carbs_g ?? 0,
        fat_g: aiItem?.fat_g ?? 0,
        confidence_score: aiItem?.confidence_score ?? 0.5,
        data_source: aiItem?.data_source ?? 'claude',
      };
    });

    return NextResponse.json({ data, error: null });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown estimation error';
    console.error('Estimate-items error:', err);
    return NextResponse.json(
      { data: null, error: { code: 'ESTIMATION_ERROR', message } },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { updates } = body as {
      updates: {
        item_id: string;
        estimated_calories: number;
        estimated_protein_g: number;
        estimated_carbs_g: number;
        estimated_fat_g: number;
        confidence_score: number;
      }[];
    };

    if (!updates?.length) {
      return NextResponse.json(
        { data: null, error: { code: 'VALIDATION', message: 'updates array is required' } },
        { status: 400 }
      );
    }

    await backfillAiEstimates(updates);

    return NextResponse.json({ data: { updated: updates.length }, error: null });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown backfill error';
    console.error('Backfill error:', err);
    return NextResponse.json(
      { data: null, error: { code: 'BACKFILL_ERROR', message } },
      { status: 500 }
    );
  }
}
