'use client';

import { useMemo } from 'react';
import { useHabits } from '@/store/useHabits';
import { HeatmapGrid } from '@/components/shared/charts';

interface HabitHeatmapProps {
  habitId?: string; // If provided, show single habit. Otherwise aggregate all.
}

export default function HabitHeatmap({ habitId }: HabitHeatmapProps) {
  const { habits, completionMap } = useHabits();

  const data = useMemo(() => {
    const map: Record<string, number> = {};

    if (habitId) {
      // Single habit heatmap
      const completions = completionMap[habitId] || {};
      for (const date of Object.keys(completions)) {
        map[date] = 1;
      }
    } else {
      // Aggregate: count how many habits completed per day
      for (const habit of habits) {
        const completions = completionMap[habit.id] || {};
        for (const date of Object.keys(completions)) {
          map[date] = (map[date] || 0) + 1;
        }
      }
    }

    return map;
  }, [habits, completionMap, habitId]);

  return (
    <div>
      <h4 className="text-xs text-dim uppercase tracking-wide mb-3">
        {habitId ? 'Habit History' : 'All Habits — Last Year'}
      </h4>
      <HeatmapGrid data={data} weeks={52} />
    </div>
  );
}
