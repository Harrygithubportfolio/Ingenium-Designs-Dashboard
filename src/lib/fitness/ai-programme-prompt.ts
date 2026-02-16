import type { ProgrammeQuestionnaire } from './programme-types';
import { PROGRAMME_GOAL_LABELS, EXPERIENCE_LEVEL_LABELS, EQUIPMENT_ACCESS_LABELS } from './programme-types';

export function buildProgrammePrompt(questionnaire: ProgrammeQuestionnaire): {
  system: string;
  user: string;
} {
  const system = `You are an expert personal trainer and strength & conditioning coach. You design evidence-based training programmes using principles of progressive overload, periodisation, and exercise selection appropriate to the client's level and equipment.

You MUST respond with ONLY valid JSON matching this exact schema (no markdown fences, no commentary):

{
  "programme_name": "string — a motivating name for the programme",
  "description": "string — 2-3 sentence overview of the programme",
  "duration_weeks": number,
  "days_per_week": number,
  "training_split": "string — e.g. 'Upper/Lower', 'Push/Pull/Legs', 'Full Body'",
  "progression_notes": "string — how to progress week over week (load, reps, sets)",
  "weeks": [
    {
      "week_number": number,
      "focus": "string — brief focus for this week e.g. 'Foundation & Form'",
      "days": [
        {
          "day_number": number (1-7, 1=Monday),
          "workout_name": "string — e.g. 'Upper Body A'",
          "training_intent": "strength" | "hypertrophy" | "recovery" | "conditioning",
          "exercises": [
            {
              "exercise_name": "string",
              "sets": number,
              "reps": "string — e.g. '8-12' or '5'",
              "load_suggestion": "string — e.g. 'RPE 7' or '60% 1RM' or 'Bodyweight'",
              "rest_seconds": number,
              "notes": "string | null — form cues or alternatives"
            }
          ],
          "notes": "string | null — session-level notes"
        }
      ]
    }
  ]
}

Rules:
- Use UK English throughout (programme, emphasise, colour, etc.)
- Design ${questionnaire.days_per_week} training days per week, keeping the remaining days as rest
- Each session should take approximately ${questionnaire.session_duration_min} minutes
- Progress difficulty appropriately across the weeks
- Include warm-up exercises at the start of each session (2-3 exercises)
- Include compound movements before isolation exercises
- For beginners: focus on form, use simple exercises, moderate volume
- For intermediate: include some advanced techniques, moderate-high volume
- For advanced: periodise with deload weeks, higher volume, varied rep ranges
- Provide clear load suggestions relative to effort level (RPE or %1RM)
- If there are injuries or limitations, avoid exercises that could aggravate them and suggest alternatives`;

  const currentLifts = questionnaire.current_lifts;
  const liftsStr = currentLifts
    ? [
        currentLifts.squat_kg && `Squat: ${currentLifts.squat_kg}kg`,
        currentLifts.bench_kg && `Bench: ${currentLifts.bench_kg}kg`,
        currentLifts.deadlift_kg && `Deadlift: ${currentLifts.deadlift_kg}kg`,
        currentLifts.overhead_press_kg && `OHP: ${currentLifts.overhead_press_kg}kg`,
      ]
        .filter(Boolean)
        .join(', ')
    : null;

  const user = `Design a bespoke training programme for this client:

- Age: ${questionnaire.age}
- Experience level: ${EXPERIENCE_LEVEL_LABELS[questionnaire.experience_level]}
- Primary goal: ${PROGRAMME_GOAL_LABELS[questionnaire.primary_goal]}
- Available days per week: ${questionnaire.days_per_week}
- Preferred session duration: ${questionnaire.session_duration_min} minutes
- Equipment access: ${EQUIPMENT_ACCESS_LABELS[questionnaire.equipment_access]}
${questionnaire.injuries_limitations ? `- Injuries/limitations: ${questionnaire.injuries_limitations}` : '- No injuries or limitations reported'}
${questionnaire.current_bodyweight_kg ? `- Current bodyweight: ${questionnaire.current_bodyweight_kg}kg` : ''}
${liftsStr ? `- Current lifts: ${liftsStr}` : ''}

Design an ${getDurationRange(questionnaire)}-week programme. Return ONLY the JSON object, no additional text.`;

  return { system, user };
}

function getDurationRange(q: ProgrammeQuestionnaire): string {
  // Beginners benefit from shorter programmes; advanced from longer
  switch (q.experience_level) {
    case 'beginner':
      return '8';
    case 'intermediate':
      return '10';
    case 'advanced':
      return '12';
    default:
      return '10';
  }
}
