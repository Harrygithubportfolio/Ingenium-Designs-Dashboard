'use client';

import { useEffect, useMemo } from 'react';
import { useHealth } from '@/store/useHealth';
import { BarChartCard } from '@/components/shared/charts';

interface SleepChartProps {
  days?: number;
}

export default function SleepChart({ days = 7 }: SleepChartProps) {
  const { sleepHistory, fetchSleepHistory } = useHealth();

  useEffect(() => {
    const to = new Date().toISOString().slice(0, 10);
    const from = new Date();
    from.setDate(from.getDate() - (days - 1));
    fetchSleepHistory(from.toISOString().slice(0, 10), to);
  }, [days, fetchSleepHistory]);

  const chartData = useMemo(() => {
    const dateMap = new Map(sleepHistory.map((s) => [s.log_date, s]));
    const result = [];
    const cursor = new Date();
    cursor.setDate(cursor.getDate() - (days - 1));

    for (let i = 0; i < days; i++) {
      const iso = cursor.toISOString().slice(0, 10);
      const log = dateMap.get(iso);
      result.push({
        date: cursor.toLocaleDateString('en-GB', { weekday: 'short' }),
        hours: log ? Number(log.hours_slept) : 0,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    return result;
  }, [sleepHistory, days]);

  return (
    <div>
      <h4 className="text-xs text-dim uppercase tracking-wide mb-3">Sleep — Last {days} days</h4>
      <BarChartCard
        data={chartData}
        xKey="date"
        yKey="hours"
        colour="var(--accent)"
        height={180}
        formatY={(v) => `${v}h`}
      />
    </div>
  );
}
