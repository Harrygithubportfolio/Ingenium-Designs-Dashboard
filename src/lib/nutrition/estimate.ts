import { getAiProvider } from '@/lib/ai/provider';
import { parseAiJson } from '@/lib/ai/parse-json';
import { buildEstimationPrompt } from './ai-prompt';
import { lookupUsda } from './usda-lookup';
import type { AiEstimatedItem, EstimationRequest, EstimationResponse } from './ai-types';

export async function estimateMealFromText(
  input: EstimationRequest
): Promise<EstimationResponse> {
  const provider = getAiProvider();
  const prompt = buildEstimationPrompt(input.description);

  const result = await provider.complete({
    prompt,
    maxTokens: 2048,
    jsonMode: true,
  });

  const parsed = parseAiJson<{ items: Omit<AiEstimatedItem, 'data_source'>[] }>(
    result.text
  );

  // Determine data_source labels based on provider
  const aiOnlySource: AiEstimatedItem['data_source'] =
    provider.name === 'anthropic' ? 'claude' : 'gemini';
  const aiPlusUsdaSource: AiEstimatedItem['data_source'] =
    provider.name === 'anthropic' ? 'claude+usda' : 'gemini+usda';

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

        // Check how close AI and USDA agree
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
            data_source: aiPlusUsdaSource,
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

      return { ...item, data_source: aiOnlySource };
    })
  );

  return {
    items: enhancedItems,
    raw_description: input.description,
    model_used: result.modelUsed,
  };
}
