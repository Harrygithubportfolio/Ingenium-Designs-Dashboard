import Anthropic from '@anthropic-ai/sdk';
import { buildEstimationPrompt } from './ai-prompt';
import { lookupUsda } from './usda-lookup';
import type { AiEstimatedItem, EstimationRequest, EstimationResponse } from './ai-types';

const MODEL = 'claude-sonnet-4-5-20250929';

export async function estimateMealFromText(
  input: EstimationRequest
): Promise<EstimationResponse> {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY!,
  });

  const { system, user } = buildEstimationPrompt(input.description);

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system,
    messages: [{ role: 'user', content: user }],
  });

  // Extract text content from response
  const textBlock = message.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  // Parse JSON from response
  let parsed: { items: Omit<AiEstimatedItem, 'data_source'>[] };
  try {
    parsed = JSON.parse(textBlock.text);
  } catch {
    // Try to extract JSON from markdown code block if Claude wraps it
    const jsonMatch = textBlock.text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[1]);
    } else {
      throw new Error('Failed to parse AI response as JSON');
    }
  }

  // Cross-reference with USDA for each item
  const enhancedItems: AiEstimatedItem[] = await Promise.all(
    parsed.items.map(async (item) => {
      const usda = await lookupUsda(item.food_name);

      if (usda && item.portion_grams) {
        const scale = item.portion_grams / 100;
        const usdaCals = Math.round(usda.calories * scale);
        const usdaProtein = Math.round(usda.protein_g * scale * 10) / 10;
        const usdaCarbs = Math.round(usda.carbs_g * scale * 10) / 10;
        const usdaFat = Math.round(usda.fat_g * scale * 10) / 10;

        // Check how close Claude and USDA agree
        const calDiff =
          Math.abs(item.calories - usdaCals) / Math.max(item.calories, 1);

        if (calDiff < 0.3) {
          // Close agreement — average both and boost confidence
          return {
            ...item,
            calories: Math.round((item.calories + usdaCals) / 2),
            protein_g:
              Math.round(((item.protein_g + usdaProtein) / 2) * 10) / 10,
            carbs_g:
              Math.round(((item.carbs_g + usdaCarbs) / 2) * 10) / 10,
            fat_g: Math.round(((item.fat_g + usdaFat) / 2) * 10) / 10,
            confidence_score: Math.min(1.0, item.confidence_score + 0.15),
            data_source: 'claude+usda' as const,
          };
        } else {
          // Large divergence — prefer USDA (lab-measured)
          return {
            ...item,
            calories: usdaCals,
            protein_g: usdaProtein,
            carbs_g: usdaCarbs,
            fat_g: usdaFat,
            confidence_score: 0.85,
            data_source: 'usda' as const,
          };
        }
      }

      return { ...item, data_source: 'claude' as const };
    })
  );

  return {
    items: enhancedItems,
    raw_description: input.description,
    model_used: MODEL,
  };
}
