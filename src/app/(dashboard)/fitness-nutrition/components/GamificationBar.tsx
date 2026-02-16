import Link from 'next/link';
import type { FitnessProfile, FitnessAchievement } from '@/lib/fitness/gamification-types';
import { LEVEL_NAMES, getLevelProgress } from '@/lib/fitness/gamification-types';
import { getAchievementByKey } from '@/lib/fitness/achievement-definitions';

interface GamificationBarProps {
  profile: FitnessProfile | null;
  achievements: FitnessAchievement[];
  loading: boolean;
}

export default function GamificationBar({ profile, achievements, loading }: GamificationBarProps) {
  if (loading) {
    return <div className="h-16 bg-inner rounded-2xl animate-pulse" />;
  }

  if (!profile) {
    return (
      <Link
        href="/fitness/achievements"
        className="bg-gradient-to-br from-card to-inner rounded-2xl border border-edge p-4 flex items-center justify-between hover:border-accent/30 transition-all"
      >
        <p className="text-xs text-dim">Complete your first workout to start earning XP</p>
        <svg className="w-4 h-4 text-dim" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    );
  }

  const { progress } = getLevelProgress(profile.total_xp);
  const levelName = LEVEL_NAMES[profile.current_level - 1] ?? 'Unknown';
  const recentBadges = achievements.slice(0, 4);

  return (
    <Link
      href="/fitness/achievements"
      className="bg-gradient-to-br from-card to-inner rounded-2xl border border-edge p-4 hover:border-accent/30 transition-all"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-heading">
            Level {profile.current_level}
          </span>
          <span className="text-xs text-accent font-medium">{levelName}</span>
        </div>
        <span className="text-xs text-dim">{profile.total_xp.toLocaleString()} XP</span>
      </div>

      <div className="w-full h-1.5 bg-inner rounded-full overflow-hidden mb-2">
        <div
          className="h-full bg-gradient-to-r from-accent to-accent-secondary rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {recentBadges.length > 0 && (
        <div className="flex items-center gap-2">
          {recentBadges.map((a) => {
            const def = getAchievementByKey(a.achievement_key);
            return (
              <span key={a.id} className="text-lg" title={def?.name}>
                {def?.icon ?? '?'}
              </span>
            );
          })}
          {achievements.length > 4 && (
            <span className="text-[10px] text-dim">+{achievements.length - 4} more</span>
          )}
        </div>
      )}
    </Link>
  );
}
