import type { SupabaseClient } from '@supabase/supabase-js';
import type { PersonalRecordDB } from './gamification-types';
import { XP_CONFIG, getStreakMultiplier, getLevelForXP } from './gamification-types';
import {
  ensureFitnessProfile,
  checkAndAwardPRs,
  awardXP,
  updateStreak,
  checkAndUnlockAchievements,
} from './gamification-mutations';

export interface WorkoutCompletionResult {
  xpEarned: number;
  xpBreakdown: {
    base: number;
    prBonus: number;
    streakMultiplier: number;
    total: number;
  };
  newPRs: PersonalRecordDB[];
  newAchievements: string[];
  previousLevel: number;
  newLevel: number;
  leveledUp: boolean;
  streak: number;
}

export async function processWorkoutCompletion(
  supabase: SupabaseClient,
  userId: string,
  sessionId: string
): Promise<WorkoutCompletionResult> {
  // 1. Ensure profile exists
  await ensureFitnessProfile(supabase, userId);

  // 2. Get current profile state
  const { data: profileBefore } = await supabase
    .from('fitness_profiles')
    .select('total_xp, current_level, total_workouts, total_volume_kg')
    .eq('user_id', userId)
    .single();
  const previousLevel = profileBefore?.current_level ?? 1;

  // 3. Check for new PRs
  const newPRs = await checkAndAwardPRs(supabase, userId, sessionId);

  // 4. Update streak
  const { streak } = await updateStreak(supabase, userId);

  // 5. Calculate XP
  const baseXP = XP_CONFIG.WORKOUT_COMPLETE;
  const prBonus = newPRs.length * XP_CONFIG.PR_HIT;
  const streakMultiplier = getStreakMultiplier(streak);
  const totalXP = Math.round((baseXP + prBonus) * streakMultiplier);

  // 6. Award XP
  const xpResult = await awardXP(
    supabase,
    userId,
    totalXP,
    'workout_complete',
    sessionId,
    `Workout completed: ${baseXP} base + ${prBonus} PR bonus × ${streakMultiplier.toFixed(1)} streak`
  );

  // Award additional XP for each PR individually (for XP log granularity)
  for (const pr of newPRs) {
    await awardXP(
      supabase,
      userId,
      XP_CONFIG.PR_HIT,
      'pr_hit',
      pr.id,
      `New ${pr.record_type} PR: ${pr.exercise_name} — ${pr.value}`
    );
  }

  // 7. Update profile totals (workout count + volume)
  const { data: session } = await supabase
    .from('gym_sessions')
    .select('total_volume_kg')
    .eq('id', sessionId)
    .single();

  const sessionVolume = Number(session?.total_volume_kg ?? 0);

  await supabase
    .from('fitness_profiles')
    .update({
      total_workouts: (profileBefore?.total_workouts ?? 0) + 1,
      total_volume_kg: Number(profileBefore?.total_volume_kg ?? 0) + sessionVolume,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  // 8. Check for new achievements
  const newAchievements = await checkAndUnlockAchievements(supabase, userId);

  // Award XP for each new achievement
  for (const key of newAchievements) {
    await awardXP(
      supabase,
      userId,
      XP_CONFIG.ACHIEVEMENT_UNLOCK,
      'achievement_unlock',
      undefined,
      `Achievement unlocked: ${key}`
    );
  }

  // 9. Get final level
  const newLevel = xpResult?.newLevel ?? getLevelForXP(xpResult?.newTotalXP ?? 0);

  return {
    xpEarned: totalXP,
    xpBreakdown: {
      base: baseXP,
      prBonus,
      streakMultiplier,
      total: totalXP,
    },
    newPRs,
    newAchievements,
    previousLevel,
    newLevel,
    leveledUp: newLevel > previousLevel,
    streak,
  };
}
