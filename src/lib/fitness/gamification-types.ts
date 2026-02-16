// ============================================
// GAMIFICATION — TYPE DEFINITIONS
// ============================================

// --- Personal Records ---

export type PRRecordType = 'weight' | 'reps' | 'volume';

export interface PersonalRecordDB {
  id: string;
  user_id: string;
  exercise_name: string;
  record_type: PRRecordType;
  value: number;
  previous_value: number | null;
  gym_session_id: string | null;
  achieved_at: string;
  created_at: string;
}

// --- XP Log ---

export type XPSourceType =
  | 'workout_complete'
  | 'pr_hit'
  | 'streak_bonus'
  | 'programme_complete'
  | 'achievement_unlock';

export interface FitnessXPLog {
  id: string;
  user_id: string;
  xp_amount: number;
  source_type: XPSourceType;
  source_id: string | null;
  description: string | null;
  created_at: string;
}

// --- Achievements ---

export interface FitnessAchievement {
  id: string;
  user_id: string;
  achievement_key: string;
  unlocked_at: string;
  metadata: Record<string, unknown>;
}

// --- Fitness Profile ---

export interface FitnessProfile {
  id: string;
  user_id: string;
  total_xp: number;
  current_level: number;
  current_streak: number;
  longest_streak: number;
  last_workout_date: string | null;
  total_workouts: number;
  total_volume_kg: number;
  created_at: string;
  updated_at: string;
}

// --- Achievement Definitions (static, not stored in DB) ---

export type AchievementCategory =
  | 'consistency'
  | 'strength'
  | 'volume'
  | 'milestones'
  | 'special';

export type AchievementCriteria =
  | { type: 'streak'; days: number }
  | { type: 'total_workouts'; count: number }
  | { type: 'total_volume_kg'; amount: number }
  | { type: 'pr_count'; count: number }
  | { type: 'programme_complete'; count: number }
  | { type: 'custom'; key: string };

export interface AchievementDefinition {
  key: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  criteria: AchievementCriteria;
}

// --- XP Configuration ---

export const XP_CONFIG = {
  WORKOUT_COMPLETE: 100,
  PR_HIT: 50,
  STREAK_BONUS_PER_DAY: 0.1,  // +10% per streak day
  MAX_STREAK_MULTIPLIER: 2.0,  // cap at 2x
  PROGRAMME_COMPLETE: 500,
  ACHIEVEMENT_UNLOCK: 25,
} as const;

// --- Level Thresholds ---

export const LEVEL_THRESHOLDS = [
  0,       // Level 1
  100,     // Level 2
  300,     // Level 3
  600,     // Level 4
  1000,    // Level 5
  1500,    // Level 6
  2200,    // Level 7
  3000,    // Level 8
  4000,    // Level 9
  5200,    // Level 10
  6500,    // Level 11
  8000,    // Level 12
  10000,   // Level 13
  12500,   // Level 14
  15500,   // Level 15
  19000,   // Level 16
  23000,   // Level 17
  27500,   // Level 18
  32500,   // Level 19
  38000,   // Level 20
] as const;

export const LEVEL_NAMES = [
  'Novice',        // 1
  'Beginner',      // 2
  'Regular',       // 3
  'Committed',     // 4
  'Dedicated',     // 5
  'Warrior',       // 6
  'Athlete',       // 7
  'Champion',      // 8
  'Legend',         // 9
  'Elite',         // 10
  'Iron Will',     // 11
  'Titan',         // 12
  'Olympian',      // 13
  'Gladiator',     // 14
  'Unstoppable',   // 15
  'Mythic',        // 16
  'Demigod',       // 17
  'Immortal',      // 18
  'Transcendent',  // 19
  'Supreme',       // 20
] as const;

// --- Helper Functions ---

export function getLevelForXP(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

export function getXPForNextLevel(currentLevel: number): number {
  if (currentLevel >= LEVEL_THRESHOLDS.length) return Infinity;
  return LEVEL_THRESHOLDS[currentLevel]; // next level threshold
}

export function getLevelProgress(xp: number): { current: number; next: number; progress: number } {
  const level = getLevelForXP(xp);
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const nextThreshold = LEVEL_THRESHOLDS[level] ?? currentThreshold;
  const range = nextThreshold - currentThreshold;
  const progress = range > 0 ? ((xp - currentThreshold) / range) * 100 : 100;
  return { current: currentThreshold, next: nextThreshold, progress: Math.min(progress, 100) };
}

export function getStreakMultiplier(streak: number): number {
  const multiplier = 1 + streak * XP_CONFIG.STREAK_BONUS_PER_DAY;
  return Math.min(multiplier, XP_CONFIG.MAX_STREAK_MULTIPLIER);
}
