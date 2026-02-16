import StatCard from '@/components/shared/charts/StatCard';

interface FitnessStatsGridProps {
  monthlyWorkouts: number;
  streak: number;
  monthlyVolume: number;
  prCount: number;
}

export default function FitnessStatsGrid({
  monthlyWorkouts,
  streak,
  monthlyVolume,
  prCount,
}: FitnessStatsGridProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard
        label="Workouts This Month"
        value={monthlyWorkouts}
      />
      <StatCard
        label="Current Streak"
        value={`${streak} days`}
      />
      <StatCard
        label="Monthly Volume"
        value={monthlyVolume >= 1000
          ? `${(monthlyVolume / 1000).toFixed(1)}t`
          : `${Math.round(monthlyVolume)} kg`
        }
      />
      <StatCard
        label="Personal Records"
        value={prCount}
      />
    </div>
  );
}
