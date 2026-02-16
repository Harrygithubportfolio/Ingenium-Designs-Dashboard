import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { getAiProvider, isAiConfigured } from '@/lib/ai/provider';
import { parseAiJson } from '@/lib/ai/parse-json';
import { buildProgrammePrompt } from '@/lib/fitness/ai-programme-prompt';
import { createProgramme } from '@/lib/fitness/programme-mutations';
import type { ProgrammeQuestionnaire, AiGeneratedPlan } from '@/lib/fitness/programme-types';

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
    const questionnaire = (await request.json()) as ProgrammeQuestionnaire;

    // Validate required fields
    if (!questionnaire.age || !questionnaire.experience_level || !questionnaire.primary_goal ||
        !questionnaire.days_per_week || !questionnaire.session_duration_min || !questionnaire.equipment_access) {
      return NextResponse.json(
        { data: null, error: { code: 'VALIDATION', message: 'Missing required questionnaire fields' } },
        { status: 400 }
      );
    }

    if (!isAiConfigured()) {
      return NextResponse.json(
        { data: null, error: { code: 'CONFIG_ERROR', message: 'AI is not configured. Set AI_PROVIDER and the corresponding API key.' } },
        { status: 503 }
      );
    }

    const { system, user: userPrompt } = buildProgrammePrompt(questionnaire);

    const provider = getAiProvider();
    const result = await provider.complete({
      prompt: { system, user: userPrompt },
      maxTokens: 16384,
      jsonMode: true,
    });

    const plan = parseAiJson<AiGeneratedPlan>(result.text);

    if (!plan || !plan.weeks || plan.weeks.length === 0) {
      return NextResponse.json(
        { data: null, error: { code: 'AI_ERROR', message: 'AI returned an invalid programme structure' } },
        { status: 500 }
      );
    }

    // Save to database
    const programme = await createProgramme(supabase, user.id, questionnaire, plan);

    return NextResponse.json({ data: programme, error: null });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error generating programme';
    console.error('Programme generation error:', err);
    return NextResponse.json(
      { data: null, error: { code: 'GENERATION_ERROR', message } },
      { status: 500 }
    );
  }
}
