// ============================================
// ACHIEVEMENT DEFINITIONS — STATIC REGISTRY
// ============================================

import type { AchievementDefinition } from './gamification-types';

export const ACHIEVEMENTS: AchievementDefinition[] = [
  // ── Milestones ──
  {
    key: 'first_workout',
    name: 'First Steps',
    description: 'Complete your first workout',
    icon: '🏋️',
    category: 'milestones',
    criteria: { type: 'total_workouts', count: 1 },
  },
  {
    key: 'ten_workouts',
    name: 'Getting Started',
    description: 'Complete 10 workouts',
    icon: '💪',
    category: 'milestones',
    criteria: { type: 'total_workouts', count: 10 },
  },
  {
    key: 'fifty_workouts',
    name: 'Half Century',
    description: 'Complete 50 workouts',
    icon: '🎯',
    category: 'milestones',
    criteria: { type: 'total_workouts', count: 50 },
  },
  {
    key: 'hundred_workouts',
    name: 'Centurion',
    description: 'Complete 100 workouts',
    icon: '🏆',
    category: 'milestones',
    criteria: { type: 'total_workouts', count: 100 },
  },
  {
    key: 'two_fifty_workouts',
    name: 'Iron Regular',
    description: 'Complete 250 workouts',
    icon: '⚔️',
    category: 'milestones',
    criteria: { type: 'total_workouts', count: 250 },
  },
  {
    key: 'five_hundred_workouts',
    name: 'Living Legend',
    description: 'Complete 500 workouts',
    icon: '👑',
    category: 'milestones',
    criteria: { type: 'total_workouts', count: 500 },
  },

  // ── Consistency ──
  {
    key: 'streak_3',
    name: 'Hat Trick',
    description: 'Maintain a 3-day workout streak',
    icon: '🔥',
    category: 'consistency',
    criteria: { type: 'streak', days: 3 },
  },
  {
    key: 'streak_7',
    name: 'Week Warrior',
    description: 'Maintain a 7-day workout streak',
    icon: '⚡',
    category: 'consistency',
    criteria: { type: 'streak', days: 7 },
  },
  {
    key: 'streak_14',
    name: 'Fortnight Fighter',
    description: 'Maintain a 14-day workout streak',
    icon: '🌟',
    category: 'consistency',
    criteria: { type: 'streak', days: 14 },
  },
  {
    key: 'streak_30',
    name: 'Monthly Machine',
    description: 'Maintain a 30-day workout streak',
    icon: '🔱',
    category: 'consistency',
    criteria: { type: 'streak', days: 30 },
  },
  {
    key: 'streak_60',
    name: 'Unbreakable',
    description: 'Maintain a 60-day workout streak',
    icon: '💎',
    category: 'consistency',
    criteria: { type: 'streak', days: 60 },
  },
  {
    key: 'streak_100',
    name: 'Relentless',
    description: 'Maintain a 100-day workout streak',
    icon: '🏅',
    category: 'consistency',
    criteria: { type: 'streak', days: 100 },
  },

  // ── Strength (PRs) ──
  {
    key: 'first_pr',
    name: 'New Record',
    description: 'Hit your first personal record',
    icon: '📈',
    category: 'strength',
    criteria: { type: 'pr_count', count: 1 },
  },
  {
    key: 'ten_prs',
    name: 'Record Breaker',
    description: 'Hit 10 personal records',
    icon: '🚀',
    category: 'strength',
    criteria: { type: 'pr_count', count: 10 },
  },
  {
    key: 'twenty_five_prs',
    name: 'PR Machine',
    description: 'Hit 25 personal records',
    icon: '💥',
    category: 'strength',
    criteria: { type: 'pr_count', count: 25 },
  },
  {
    key: 'fifty_prs',
    name: 'Limit Breaker',
    description: 'Hit 50 personal records',
    icon: '⚡',
    category: 'strength',
    criteria: { type: 'pr_count', count: 50 },
  },
  {
    key: 'hundred_prs',
    name: 'Beyond Limits',
    description: 'Hit 100 personal records',
    icon: '🌋',
    category: 'strength',
    criteria: { type: 'pr_count', count: 100 },
  },

  // ── Volume ──
  {
    key: 'volume_10k',
    name: 'Ten Tonne',
    description: 'Lift a total of 10,000 kg',
    icon: '🪨',
    category: 'volume',
    criteria: { type: 'total_volume_kg', amount: 10000 },
  },
  {
    key: 'volume_50k',
    name: 'Iron Mountain',
    description: 'Lift a total of 50,000 kg',
    icon: '⛰️',
    category: 'volume',
    criteria: { type: 'total_volume_kg', amount: 50000 },
  },
  {
    key: 'volume_100k',
    name: 'Six Figures',
    description: 'Lift a total of 100,000 kg',
    icon: '🏔️',
    category: 'volume',
    criteria: { type: 'total_volume_kg', amount: 100000 },
  },
  {
    key: 'volume_500k',
    name: 'Half Million',
    description: 'Lift a total of 500,000 kg',
    icon: '🌍',
    category: 'volume',
    criteria: { type: 'total_volume_kg', amount: 500000 },
  },
  {
    key: 'volume_1m',
    name: 'Millionaire',
    description: 'Lift a total of 1,000,000 kg',
    icon: '🌌',
    category: 'volume',
    criteria: { type: 'total_volume_kg', amount: 1000000 },
  },

  // ── Special ──
  {
    key: 'programme_complete_1',
    name: 'Programme Graduate',
    description: 'Complete your first training programme',
    icon: '🎓',
    category: 'special',
    criteria: { type: 'programme_complete', count: 1 },
  },
  {
    key: 'programme_complete_3',
    name: 'Programme Veteran',
    description: 'Complete 3 training programmes',
    icon: '🎖️',
    category: 'special',
    criteria: { type: 'programme_complete', count: 3 },
  },
  {
    key: 'programme_complete_5',
    name: 'Programme Master',
    description: 'Complete 5 training programmes',
    icon: '🏛️',
    category: 'special',
    criteria: { type: 'programme_complete', count: 5 },
  },
];

export function getAchievementByKey(key: string): AchievementDefinition | undefined {
  return ACHIEVEMENTS.find((a) => a.key === key);
}

export function getAchievementsByCategory(category: AchievementDefinition['category']): AchievementDefinition[] {
  return ACHIEVEMENTS.filter((a) => a.category === category);
}
