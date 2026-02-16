'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useFitnessProfile } from '@/store/useFitnessProfile';
import { ACHIEVEMENTS, getAchievementByKey } from '@/lib/fitness/achievement-definitions';
import {
  LEVEL_NAMES,
  getLevelProgress,
} from '@/lib/fitness/gamification-types';
import type { AchievementCategory } from '@/lib/fitness/gamification-types';

type FilterTab = 'all' | AchievementCategory;

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'milestones', label: 'Milestones' },
  { key: 'consistency', label: 'Consistency' },
  { key: 'strength', label: 'Strength' },
  { key: 'volume', label: 'Volume' },
  { key: 'special', label: 'Special' },
];

export default function AchievementsPage() {
  const { profile, achievements, recentPRs, prCount, loading, fetchAll } = useFitnessProfile();
  const [filter, setFilter] = useState<FilterTab>('all');

  useEffect(() => {
    fetchAll();
  }, []);

  const unlockedKeys = new Set(achievements.map((a) => a.achievement_key));
  const filteredAchievements = filter === 'all'
    ? ACHIEVEMENTS
    : ACHIEVEMENTS.filter((a) => a.category === filter);

  const levelProgress = profile ? getLevelProgress(profile.total_xp) : { current: 0, next: 100, progress: 0 };
  const levelName = profile ? LEVEL_NAMES[profile.current_level - 1] ?? 'Unknown' : 'Unknown';

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center gap-3">
        <Link href="/fitness-nutrition" className="text-dim hover:text-sub transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        </div>
        <div>
          <h1 className="text-lg font-semibold text-heading">Achievements</h1>
          <p className="text-dim text-[11px]">Track your fitness milestones</p>
        </div>
      </header>

      {/* Level Card */}
      {loading ? (
        <div className="flex-shrink-0 h-24 bg-inner rounded-2xl animate-pulse" />
      ) : profile ? (
        <div className="flex-shrink-0 bg-gradient-to-br from-card to-inner rounded-2xl border border-edge p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[10px] text-dim uppercase">Level {profile.current_level}</p>
              <p className="text-lg font-bold text-heading">{levelName}</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-accent">{profile.total_xp.toLocaleString()}</p>
              <p className="text-[10px] text-dim">Total XP</p>
            </div>
          </div>
          <div className="w-full h-2 bg-inner rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent to-accent-secondary rounded-full transition-all duration-500"
              style={{ width: `${levelProgress.progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[10px] text-dim">{levelProgress.current.toLocaleString()} XP</span>
            <span className="text-[10px] text-dim">{levelProgress.next.toLocaleString()} XP</span>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-4 gap-3 mt-4">
            <div className="bg-inner rounded-xl p-2 text-center">
              <p className="text-lg font-bold text-heading">{profile.total_workouts}</p>
              <p className="text-[9px] text-dim uppercase">Workouts</p>
            </div>
            <div className="bg-inner rounded-xl p-2 text-center">
              <p className="text-lg font-bold text-green-400">{profile.current_streak}</p>
              <p className="text-[9px] text-dim uppercase">Streak</p>
            </div>
            <div className="bg-inner rounded-xl p-2 text-center">
              <p className="text-lg font-bold text-purple-400">{prCount}</p>
              <p className="text-[9px] text-dim uppercase">PRs</p>
            </div>
            <div className="bg-inner rounded-xl p-2 text-center">
              <p className="text-lg font-bold text-amber-400">{achievements.length}</p>
              <p className="text-[9px] text-dim uppercase">Badges</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-shrink-0 bg-gradient-to-br from-card to-inner rounded-2xl border border-edge p-5 text-center">
          <p className="text-sm text-dim">Complete your first workout to start earning XP!</p>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex-shrink-0 flex items-center gap-1.5 overflow-x-auto pb-1">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              filter === tab.key
                ? 'bg-accent/20 text-accent border border-accent/40'
                : 'text-dim border border-transparent hover:text-sub'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Achievement grid */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredAchievements.map((achievement) => {
            const unlocked = unlockedKeys.has(achievement.key);
            const unlockedData = achievements.find((a) => a.achievement_key === achievement.key);

            return (
              <div
                key={achievement.key}
                className={`rounded-2xl border p-4 text-center transition-all ${
                  unlocked
                    ? 'bg-gradient-to-br from-card to-inner border-accent/30 shadow-[0_0_12px_-3px] shadow-accent/20'
                    : 'bg-inner border-edge opacity-50'
                }`}
              >
                <div className="text-3xl mb-2">{achievement.icon}</div>
                <h3 className={`text-xs font-semibold mb-1 ${unlocked ? 'text-heading' : 'text-dim'}`}>
                  {achievement.name}
                </h3>
                <p className="text-[10px] text-dim">{achievement.description}</p>
                {unlocked && unlockedData && (
                  <p className="text-[9px] text-accent mt-2">
                    {new Date(unlockedData.unlocked_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* PR Hall of Fame */}
        {recentPRs.length > 0 && (
          <div className="mt-6">
            <h2 className="text-sm font-semibold text-heading mb-3">PR Hall of Fame</h2>
            <div className="bg-gradient-to-br from-card to-inner rounded-2xl border border-edge overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="text-[10px] text-dim uppercase border-b border-edge">
                    <th className="text-left px-4 py-2">Exercise</th>
                    <th className="text-right px-4 py-2">Type</th>
                    <th className="text-right px-4 py-2">Record</th>
                    <th className="text-right px-4 py-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPRs.slice(0, 20).map((pr) => (
                    <tr key={pr.id} className="border-b border-edge/50 last:border-0">
                      <td className="text-xs text-sub px-4 py-2">{pr.exercise_name}</td>
                      <td className="text-xs text-dim text-right px-4 py-2 capitalize">{pr.record_type}</td>
                      <td className="text-xs text-heading font-medium text-right px-4 py-2">
                        {pr.record_type === 'weight' ? `${pr.value} kg` :
                         pr.record_type === 'reps' ? `${pr.value} reps` :
                         `${pr.value} kg`}
                      </td>
                      <td className="text-[10px] text-dim text-right px-4 py-2">
                        {new Date(pr.achieved_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
