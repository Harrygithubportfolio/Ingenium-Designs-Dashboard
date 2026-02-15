import { SupabaseClient } from '@supabase/supabase-js';
import { getAiProvider, isAiConfigured } from './provider';

interface BriefingContext {
  date: string;
  weather?: { temp: number; description: string; location: string } | null;
  calendarEvents: string[];
  workout?: string | null;
  nutritionTargets?: { calories: number; protein_g: number } | null;
  sleepLastNight?: { hours: number; quality: number } | null;
  hydrationYesterday?: { total_ml: number; target_ml: number } | null;
  activeGoals: string[];
  habitStreaks: { name: string; streak: number }[];
}

export async function gatherDailyContext(
  supabase: SupabaseClient,
  userId: string,
  date: string,
): Promise<BriefingContext> {
  const yesterday = new Date(date);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  const [
    calendarRes,
    workoutRes,
    nutritionRes,
    sleepRes,
    hydrationRes,
    goalsRes,
    habitsRes,
  ] = await Promise.all([
    supabase.from('calendar_events').select('title, start_time').eq('event_date', date).eq('is_deleted', false).order('start_time'),
    supabase.from('scheduled_workouts').select('*, template:workout_templates(name)').eq('scheduled_date', date).eq('status', 'scheduled').maybeSingle(),
    supabase.from('daily_nutrition_targets').select('*').eq('target_date', date).maybeSingle(),
    supabase.from('sleep_logs').select('*').eq('log_date', date).maybeSingle(),
    supabase.from('hydration_logs').select('*').eq('log_date', yesterdayStr).maybeSingle(),
    supabase.from('goals').select('title').eq('status', 'active').limit(5),
    supabase.from('habits').select('id, name').eq('is_archived', false).eq('user_id', userId),
  ]);

  // Get habit streaks (simplified — just count recent completions)
  const habitStreaks: { name: string; streak: number }[] = [];
  if (habitsRes.data) {
    for (const habit of habitsRes.data) {
      const { count } = await supabase
        .from('habit_completions')
        .select('*', { count: 'exact', head: true })
        .eq('habit_id', habit.id)
        .gte('completion_date', new Date(new Date(date).getTime() - 30 * 86400000).toISOString().slice(0, 10));
      if (count && count > 0) {
        habitStreaks.push({ name: habit.name, streak: count });
      }
    }
  }

  return {
    date,
    calendarEvents: (calendarRes.data ?? []).map((e: { title: string; start_time: string }) =>
      e.start_time ? `${e.start_time.slice(0, 5)} - ${e.title}` : e.title
    ),
    workout: workoutRes.data?.template?.name ?? null,
    nutritionTargets: nutritionRes.data
      ? { calories: nutritionRes.data.calories, protein_g: nutritionRes.data.protein_g }
      : null,
    sleepLastNight: sleepRes.data
      ? { hours: Number(sleepRes.data.hours_slept), quality: sleepRes.data.quality }
      : null,
    hydrationYesterday: hydrationRes.data
      ? { total_ml: hydrationRes.data.total_ml, target_ml: hydrationRes.data.target_ml }
      : null,
    activeGoals: (goalsRes.data ?? []).map((g: { title: string }) => g.title),
    habitStreaks,
  };
}

function buildBriefingPrompt(context: BriefingContext): { system: string; user: string } {
  const system = `You are a personal life dashboard assistant. Summarise the user's day ahead in a warm, concise paragraph (3-5 sentences). Use UK English spelling (analyse, summarise, colour, organise). Be specific about times and numbers. End with one motivational observation. Do not use markdown formatting.`;

  const parts: string[] = [`Today is ${new Date(context.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}.`];

  if (context.weather) {
    parts.push(`Weather: ${context.weather.temp}°C, ${context.weather.description} in ${context.weather.location}.`);
  }

  if (context.calendarEvents.length > 0) {
    parts.push(`Calendar: ${context.calendarEvents.length} event${context.calendarEvents.length !== 1 ? 's' : ''} (${context.calendarEvents.slice(0, 3).join('; ')}).`);
  } else {
    parts.push('No calendar events scheduled.');
  }

  parts.push(context.workout ? `Workout: ${context.workout}.` : 'Rest day (no workout scheduled).');

  if (context.nutritionTargets) {
    parts.push(`Nutrition targets: ${context.nutritionTargets.calories}kcal, ${context.nutritionTargets.protein_g}g protein.`);
  }

  if (context.sleepLastNight) {
    parts.push(`Sleep last night: ${context.sleepLastNight.hours}h, quality ${context.sleepLastNight.quality}/5.`);
  }

  if (context.hydrationYesterday) {
    parts.push(`Hydration yesterday: ${context.hydrationYesterday.total_ml}ml / ${context.hydrationYesterday.target_ml}ml target.`);
  }

  if (context.activeGoals.length > 0) {
    parts.push(`Active goals: ${context.activeGoals.join(', ')}.`);
  }

  if (context.habitStreaks.length > 0) {
    const top = context.habitStreaks.sort((a, b) => b.streak - a.streak).slice(0, 3);
    parts.push(`Top habit streaks: ${top.map((h) => `${h.name} (${h.streak}d)`).join(', ')}.`);
  }

  return { system, user: parts.join('\n') };
}

export async function generateDailyBriefing(
  supabase: SupabaseClient,
  userId: string,
  date?: string,
): Promise<{ content: string; fromCache: boolean }> {
  const d = date || new Date().toISOString().slice(0, 10);

  // Check cache
  const { data: cached } = await supabase
    .from('daily_briefings')
    .select('content')
    .eq('user_id', userId)
    .eq('briefing_date', d)
    .eq('briefing_type', 'morning')
    .maybeSingle();

  if (cached) {
    return { content: cached.content, fromCache: true };
  }

  if (!isAiConfigured()) {
    return { content: 'AI provider not configured. Set up your API keys in environment variables to enable daily briefings.', fromCache: false };
  }

  // Gather context and generate
  const context = await gatherDailyContext(supabase, userId, d);
  const { system, user } = buildBriefingPrompt(context);

  const provider = getAiProvider();
  const result = await provider.complete({
    prompt: { system, user },
    maxTokens: 300,
  });

  // Cache the result
  await supabase.from('daily_briefings').upsert(
    {
      user_id: userId,
      briefing_date: d,
      briefing_type: 'morning',
      content: result.text,
      data_context: context,
      model_used: result.modelUsed,
    },
    { onConflict: 'user_id,briefing_date,briefing_type' },
  );

  return { content: result.text, fromCache: false };
}
