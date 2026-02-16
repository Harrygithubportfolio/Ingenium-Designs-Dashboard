import type { SupabaseClient } from '@supabase/supabase-js';
import type { PersonalRecordDB, PRRecordType, XPSourceType } from './gamification-types';
import { getLevelForXP } from './gamification-types';
import { ACHIEVEMENTS } from './achievement-definitions';

// --- Fitness Profile ---

export async function ensureFitnessProfile(supabase: SupabaseClient, userId: string) {
  const { data: existing } = await supabase
    .from('fitness_profiles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) return existing.id as string;

  const { data, error } = await supabase
    .from('fitness_profiles')
    .insert({ user_id: userId })
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  return data.id as string;
}

// --- Personal Records ---

export async function checkAndAwardPRs(
  supabase: SupabaseClient,
  userId: string,
  sessionId: string
) {
  // Get all exercises and sets from the session
  const { data: exercises, error: eErr } = await supabase
    .from('execution_exercises')
    .select('*, sets:execution_sets(*)')
    .eq('gym_session_id', sessionId)
    .eq('was_skipped', false);
  if (eErr) throw new Error(eErr.message);

  const newPRs: PersonalRecordDB[] = [];

  for (const exercise of exercises ?? []) {
    const sets = exercise.sets ?? [];
    if (sets.length === 0) continue;

    // Calculate best values for this exercise in this session
    let bestWeight = 0;
    let bestReps = 0;
    let bestVolume = 0;

    for (const set of sets) {
      const weight = Number(set.actual_weight_kg);
      const reps = Number(set.actual_reps);
      const volume = weight * reps;

      if (weight > bestWeight) bestWeight = weight;
      if (reps > bestReps) bestReps = reps;
      if (volume > bestVolume) bestVolume = volume;
    }

    // Check each record type
    const checks: { type: PRRecordType; value: number }[] = [
      { type: 'weight', value: bestWeight },
      { type: 'reps', value: bestReps },
      { type: 'volume', value: bestVolume },
    ];

    for (const check of checks) {
      if (check.value <= 0) continue;

      // Get current PR for this exercise + type
      const { data: currentPR } = await supabase
        .from('personal_records')
        .select('*')
        .eq('user_id', userId)
        .ilike('exercise_name', exercise.exercise_name)
        .eq('record_type', check.type)
        .order('value', { ascending: false })
        .limit(1)
        .maybeSingle();

      const currentValue = currentPR ? Number(currentPR.value) : 0;

      if (check.value > currentValue) {
        const { data: pr, error: prErr } = await supabase
          .from('personal_records')
          .insert({
            user_id: userId,
            exercise_name: exercise.exercise_name,
            record_type: check.type,
            value: check.value,
            previous_value: currentValue > 0 ? currentValue : null,
            gym_session_id: sessionId,
          })
          .select()
          .single();
        if (prErr) throw new Error(prErr.message);
        newPRs.push(pr as PersonalRecordDB);
      }
    }
  }

  return newPRs;
}

// --- XP ---

export async function awardXP(
  supabase: SupabaseClient,
  userId: string,
  amount: number,
  sourceType: XPSourceType,
  sourceId?: string,
  description?: string
) {
  if (amount <= 0) return;

  // Insert XP log
  const { error: xpErr } = await supabase
    .from('fitness_xp_log')
    .insert({
      user_id: userId,
      xp_amount: Math.round(amount),
      source_type: sourceType,
      source_id: sourceId ?? null,
      description: description ?? null,
    });
  if (xpErr) throw new Error(xpErr.message);

  // Update profile total
  const { data: profile, error: pErr } = await supabase
    .from('fitness_profiles')
    .select('total_xp')
    .eq('user_id', userId)
    .single();
  if (pErr) throw new Error(pErr.message);

  const newTotalXP = (profile.total_xp ?? 0) + Math.round(amount);
  const newLevel = getLevelForXP(newTotalXP);

  const { error: uErr } = await supabase
    .from('fitness_profiles')
    .update({
      total_xp: newTotalXP,
      current_level: newLevel,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);
  if (uErr) throw new Error(uErr.message);

  return { newTotalXP, newLevel };
}

// --- Streaks ---

export async function updateStreak(supabase: SupabaseClient, userId: string) {
  const today = new Date().toISOString().split('T')[0];

  const { data: profile, error: pErr } = await supabase
    .from('fitness_profiles')
    .select('current_streak, longest_streak, last_workout_date')
    .eq('user_id', userId)
    .single();
  if (pErr) throw new Error(pErr.message);

  const lastDate = profile.last_workout_date;
  let newStreak = 1;

  if (lastDate) {
    const last = new Date(lastDate);
    const todayDate = new Date(today);
    const diffDays = Math.floor(
      (todayDate.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) {
      // Already worked out today, streak unchanged
      return { streak: profile.current_streak, isNewDay: false };
    } else if (diffDays === 1) {
      // Consecutive day
      newStreak = (profile.current_streak ?? 0) + 1;
    }
    // diffDays > 1: streak resets to 1
  }

  const newLongest = Math.max(newStreak, profile.longest_streak ?? 0);

  const { error: uErr } = await supabase
    .from('fitness_profiles')
    .update({
      current_streak: newStreak,
      longest_streak: newLongest,
      last_workout_date: today,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);
  if (uErr) throw new Error(uErr.message);

  return { streak: newStreak, isNewDay: true };
}

// --- Achievements ---

export async function checkAndUnlockAchievements(
  supabase: SupabaseClient,
  userId: string
) {
  // Get current profile
  const { data: profile, error: pErr } = await supabase
    .from('fitness_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (pErr) throw new Error(pErr.message);

  // Get already unlocked achievements
  const { data: unlocked, error: aErr } = await supabase
    .from('fitness_achievements')
    .select('achievement_key')
    .eq('user_id', userId);
  if (aErr) throw new Error(aErr.message);

  const unlockedKeys = new Set((unlocked ?? []).map((a) => a.achievement_key));

  // Get PR count
  const { count: prCount } = await supabase
    .from('personal_records')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  // Get completed programme count
  const { count: programmeCount } = await supabase
    .from('training_programmes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'completed');

  const newlyUnlocked: string[] = [];

  for (const achievement of ACHIEVEMENTS) {
    if (unlockedKeys.has(achievement.key)) continue;

    let qualifies = false;
    const criteria = achievement.criteria;

    switch (criteria.type) {
      case 'streak':
        qualifies = (profile.current_streak ?? 0) >= criteria.days ||
                    (profile.longest_streak ?? 0) >= criteria.days;
        break;
      case 'total_workouts':
        qualifies = (profile.total_workouts ?? 0) >= criteria.count;
        break;
      case 'total_volume_kg':
        qualifies = Number(profile.total_volume_kg ?? 0) >= criteria.amount;
        break;
      case 'pr_count':
        qualifies = (prCount ?? 0) >= criteria.count;
        break;
      case 'programme_complete':
        qualifies = (programmeCount ?? 0) >= criteria.count;
        break;
    }

    if (qualifies) {
      const { error: iErr } = await supabase
        .from('fitness_achievements')
        .insert({
          user_id: userId,
          achievement_key: achievement.key,
          metadata: { name: achievement.name, category: achievement.category },
        });
      // Ignore unique constraint violations (already unlocked in a race)
      if (iErr && !iErr.message.includes('unique')) throw new Error(iErr.message);
      newlyUnlocked.push(achievement.key);
    }
  }

  return newlyUnlocked;
}
