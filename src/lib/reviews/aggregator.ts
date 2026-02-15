import { SupabaseClient } from '@supabase/supabase-js';
import type { ReviewMetrics } from './types';

export async function aggregateMetrics(
  supabase: SupabaseClient,
  userId: string,
  from: string,
  to: string,
): Promise<ReviewMetrics> {
  const [
    scheduledRes,
    sessionsRes,
    intakeRes,
    sleepRes,
    hydrationRes,
    focusRes,
    goalsRes,
    habitsRes,
    completionsRes,
  ] = await Promise.all([
    supabase.from('scheduled_workouts').select('status').eq('user_id', userId).gte('scheduled_date', from).lte('scheduled_date', to),
    supabase.from('gym_sessions').select('total_volume_kg, status').eq('user_id', userId).gte('started_at', `${from}T00:00:00`).lte('started_at', `${to}T23:59:59`).eq('status', 'completed'),
    supabase.from('intake_events').select('id, event_timestamp').eq('user_id', userId).gte('event_timestamp', `${from}T00:00:00`).lte('event_timestamp', `${to}T23:59:59`),
    supabase.from('sleep_logs').select('hours_slept, quality').eq('user_id', userId).gte('log_date', from).lte('log_date', to),
    supabase.from('hydration_logs').select('total_ml, target_ml').eq('user_id', userId).gte('log_date', from).lte('log_date', to),
    supabase.from('focus_sessions').select('total_focus_seconds, status').eq('user_id', userId).eq('status', 'completed').gte('started_at', `${from}T00:00:00`).lte('started_at', `${to}T23:59:59`),
    supabase.from('goals').select('status').eq('user_id', userId),
    supabase.from('habits').select('id, name').eq('user_id', userId).eq('is_archived', false),
    supabase.from('habit_completions').select('habit_id, completion_date').gte('completion_date', from).lte('completion_date', to),
  ]);

  // Fitness
  const scheduled = scheduledRes.data ?? [];
  const sessions = sessionsRes.data ?? [];
  const workoutsPlanned = scheduled.length;
  const workoutsCompleted = scheduled.filter((s) => s.status === 'completed').length;
  const totalVolume = sessions.reduce((sum, s) => sum + (Number(s.total_volume_kg) || 0), 0);

  // Nutrition
  const intakeEvents = intakeRes.data ?? [];
  const intakeDays = new Set(intakeEvents.map((e) => e.event_timestamp?.slice(0, 10))).size;

  // Sleep
  const sleepLogs = sleepRes.data ?? [];
  const avgHours = sleepLogs.length > 0 ? sleepLogs.reduce((s, l) => s + Number(l.hours_slept), 0) / sleepLogs.length : 0;
  const avgQuality = sleepLogs.length > 0 ? sleepLogs.reduce((s, l) => s + l.quality, 0) / sleepLogs.length : 0;

  // Hydration
  const hydrationLogs = hydrationRes.data ?? [];
  const avgMl = hydrationLogs.length > 0 ? hydrationLogs.reduce((s, l) => s + l.total_ml, 0) / hydrationLogs.length : 0;
  const targetHitDays = hydrationLogs.filter((l) => l.total_ml >= l.target_ml).length;

  // Focus
  const focusSessions = focusRes.data ?? [];
  const totalFocusSeconds = focusSessions.reduce((s, f) => s + (f.total_focus_seconds || 0), 0);

  // Goals
  const goals = goalsRes.data ?? [];
  const activeGoals = goals.filter((g) => g.status === 'active').length;
  const completedGoals = goals.filter((g) => g.status === 'completed').length;

  // Habits
  const habits = habitsRes.data ?? [];
  const completions = completionsRes.data ?? [];
  const totalDays = Math.max(1, Math.ceil((new Date(to).getTime() - new Date(from).getTime()) / 86400000) + 1);
  const totalPossible = habits.length * totalDays;
  const totalCompletions = completions.length;
  const completionRate = totalPossible > 0 ? Math.round((totalCompletions / totalPossible) * 100) : 0;

  // Best streak — simplified: find the habit with most completions in period
  let bestStreak: { name: string; days: number } | null = null;
  for (const habit of habits) {
    const count = completions.filter((c) => c.habit_id === habit.id).length;
    if (count > 0 && (!bestStreak || count > bestStreak.days)) {
      bestStreak = { name: habit.name, days: count };
    }
  }

  return {
    fitness: {
      workouts_planned: workoutsPlanned,
      workouts_completed: workoutsCompleted,
      total_volume_kg: Math.round(totalVolume),
      workout_adherence_pct: workoutsPlanned > 0 ? Math.round((workoutsCompleted / workoutsPlanned) * 100) : 0,
    },
    nutrition: {
      avg_calories: 0, // Would need daily summary table
      avg_protein_g: 0,
      days_logged: intakeDays,
    },
    habits: {
      total_completions: totalCompletions,
      completion_rate_pct: completionRate,
      best_streak: bestStreak,
    },
    sleep: {
      avg_hours: Math.round(avgHours * 10) / 10,
      avg_quality: Math.round(avgQuality * 10) / 10,
      days_logged: sleepLogs.length,
    },
    hydration: {
      avg_ml: Math.round(avgMl),
      target_hit_days: targetHitDays,
      days_logged: hydrationLogs.length,
    },
    focus: {
      total_minutes: Math.round(totalFocusSeconds / 60),
      sessions_completed: focusSessions.length,
    },
    goals: {
      active: activeGoals,
      completed: completedGoals,
    },
  };
}
