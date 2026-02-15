import type { MacroTotals } from './types';

interface MealForSummary {
  meal_type: string;
  items: {
    food_name: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  }[];
}

interface SummaryPromptInput {
  meals: MealForSummary[];
  consumed: MacroTotals;
  targets: MacroTotals;
  goals: { title: string; description: string | null }[];
  goalOverride?: string;
}

export function buildDailySummaryPrompt(input: SummaryPromptInput): {
  system: string;
  user: string;
} {
  const goalContext = input.goalOverride
    ? `The user's current fitness goal is: ${input.goalOverride}.`
    : input.goals.length > 0
      ? `The user's active goals are: ${input.goals.map((g) => `"${g.title}"${g.description ? ` (${g.description})` : ''}`).join(', ')}.`
      : 'No specific fitness goal has been set.';

  const system = `You are a personal nutrition coach. Given today's meal log, macro totals vs targets, and the user's fitness goals, provide a brief daily assessment.

Rules:
- IMPORTANT: Always write in British English (e.g., "prioritise" not "prioritize", "optimise" not "optimize", "fibre" not "fiber", "colour" not "color", "favour" not "favor", "recognised" not "recognized").
- Be encouraging but honest. Acknowledge what went well before suggesting improvements.
- Keep the summary concise — 2-3 sentences max.
- Provide 2-3 specific, actionable tips for the rest of the day or tomorrow.
- Consider the user's goal when giving advice (e.g., for "cut" emphasise deficit & protein; for "bulk" emphasise surplus & carbs; for "recomp" emphasise protein timing & moderate deficit).
- Return valid JSON only. No markdown, no explanation.

JSON schema:
{
  "summary": string,
  "rating": "great" | "good" | "needs_work" | "off_track",
  "tips": string[]
}

Rating guide:
- "great": all macros within 10% of targets, good food choices
- "good": most macros within 20% of targets, reasonable choices
- "needs_work": significant gaps in 1-2 macros, or poor food choices
- "off_track": major overconsumption or underconsumption, missing multiple targets by 30%+`;

  const mealBreakdown = input.meals
    .map(
      (m) =>
        `${m.meal_type}: ${m.items.map((i) => `${i.food_name} (${i.calories}cal, P:${i.protein_g}g C:${i.carbs_g}g F:${i.fat_g}g)`).join(', ')}`
    )
    .join('\n');

  const user = `${goalContext}

Today's Targets: ${input.targets.calories} cal, P:${input.targets.protein_g}g, C:${input.targets.carbs_g}g, F:${input.targets.fat_g}g

Today's Consumed: ${input.consumed.calories} cal, P:${input.consumed.protein_g}g, C:${input.consumed.carbs_g}g, F:${input.consumed.fat_g}g

Meals logged:
${mealBreakdown || '(no meals logged yet)'}

Provide your assessment.`;

  return { system, user };
}
