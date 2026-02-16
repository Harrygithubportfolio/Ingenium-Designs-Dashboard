'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { fetchVolumeOverTime, fetchWorkoutHeatmapData } from '@/lib/fitness/queries';
import TrendLineChart from '@/components/shared/charts/TrendLineChart';
import BarChartCard from '@/components/shared/charts/BarChartCard';

type Period = '4w' | '3m' | '6m' | '1y';

const PERIOD_WEEKS: Record<Period, number> = {
  '4w': 4,
  '3m': 13,
  '6m': 26,
  '1y': 52,
};

const PERIOD_LABELS: Record<Period, string> = {
  '4w': '4 Weeks',
  '3m': '3 Months',
  '6m': '6 Months',
  '1y': '1 Year',
};

interface VolumePoint {
  week: string;
  volume: number;
}

interface FrequencyPoint {
  week: string;
  workouts: number;
}

interface IntentCount {
  intent: string;
  count: number;
}

export default function AnalyticsView() {
  const [period, setPeriod] = useState<Period>('3m');
  const [volumeData, setVolumeData] = useState<VolumePoint[]>([]);
  const [frequencyData, setFrequencyData] = useState<FrequencyPoint[]>([]);
  const [intentData, setIntentData] = useState<IntentCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        const weeks = PERIOD_WEEKS[period];

        const [volume, heatmap] = await Promise.all([
          fetchVolumeOverTime(supabase, weeks),
          fetchWorkoutHeatmapData(supabase, weeks),
        ]);

        setVolumeData(volume);

        // Build weekly frequency from heatmap data
        const weeklyFreq: Record<string, number> = {};
        for (const [dateStr, count] of Object.entries(heatmap)) {
          const date = new Date(dateStr);
          const day = date.getDay();
          const diff = date.getDate() - day + (day === 0 ? -6 : 1);
          const weekStart = new Date(new Date(date).setDate(diff)).toISOString().split('T')[0];
          weeklyFreq[weekStart] = (weeklyFreq[weekStart] ?? 0) + count;
        }
        setFrequencyData(
          Object.entries(weeklyFreq)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([week, workouts]) => ({ week, workouts }))
        );

        // Fetch intent distribution
        const since = new Date();
        since.setDate(since.getDate() - weeks * 7);
        const { data: sessions } = await supabase
          .from('gym_sessions')
          .select('template:workout_templates(training_intent)')
          .eq('status', 'completed')
          .gte('started_at', since.toISOString());

        const intentCounts: Record<string, number> = {};
        for (const s of sessions ?? []) {
          const intent = (s.template as unknown as { training_intent: string } | null)?.training_intent ?? 'other';
          intentCounts[intent] = (intentCounts[intent] ?? 0) + 1;
        }
        setIntentData(
          Object.entries(intentCounts)
            .sort(([, a], [, b]) => b - a)
            .map(([intent, count]) => ({ intent, count }))
        );
      } catch (err) {
        console.error('Analytics load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [period]);

  const totalWorkouts = frequencyData.reduce((sum, d) => sum + d.workouts, 0);
  const totalVolume = volumeData.reduce((sum, d) => sum + d.volume, 0);
  const avgPerWeek = frequencyData.length > 0 ? (totalWorkouts / frequencyData.length).toFixed(1) : '0';

  const formatWeek = (w: string) => {
    const d = new Date(w + 'T00:00:00');
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  const formatVolume = (v: number) =>
    v >= 1000 ? `${(v / 1000).toFixed(1)}t` : `${v}kg`;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto space-y-4 pr-1">
      {/* Period selector */}
      <div className="flex items-center gap-1 bg-inner rounded-lg border border-edge p-0.5 w-fit">
        {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              period === p
                ? 'bg-accent/20 text-accent border border-accent/40'
                : 'text-sub hover:text-heading border border-transparent'
            }`}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 bg-card rounded-xl border border-edge text-center">
          <p className="text-xl font-bold text-heading">{totalWorkouts}</p>
          <p className="text-[10px] text-dim uppercase">Total Sessions</p>
        </div>
        <div className="p-3 bg-card rounded-xl border border-edge text-center">
          <p className="text-xl font-bold text-heading">{avgPerWeek}</p>
          <p className="text-[10px] text-dim uppercase">Avg / Week</p>
        </div>
        <div className="p-3 bg-card rounded-xl border border-edge text-center">
          <p className="text-xl font-bold text-heading">{formatVolume(totalVolume)}</p>
          <p className="text-[10px] text-dim uppercase">Total Volume</p>
        </div>
      </div>

      {/* Workout frequency bar chart */}
      <div className="bg-card rounded-xl border border-edge p-4">
        <h3 className="text-xs font-semibold text-heading mb-3">Workout Frequency</h3>
        {frequencyData.length > 1 ? (
          <BarChartCard
            data={frequencyData as unknown as Record<string, unknown>[]}
            xKey="week"
            yKey="workouts"
            height={180}
            formatX={formatWeek}
          />
        ) : (
          <div className="h-[180px] flex items-center justify-center">
            <p className="text-xs text-dim">Not enough data yet</p>
          </div>
        )}
      </div>

      {/* Volume progression line chart */}
      <div className="bg-card rounded-xl border border-edge p-4">
        <h3 className="text-xs font-semibold text-heading mb-3">Volume Progression</h3>
        {volumeData.length > 1 ? (
          <TrendLineChart
            data={volumeData as unknown as Record<string, unknown>[]}
            xKey="week"
            yKey="volume"
            height={180}
            formatX={formatWeek}
            formatY={formatVolume}
          />
        ) : (
          <div className="h-[180px] flex items-center justify-center">
            <p className="text-xs text-dim">Not enough data yet</p>
          </div>
        )}
      </div>

      {/* Training intent distribution */}
      {intentData.length > 0 && (
        <div className="bg-card rounded-xl border border-edge p-4">
          <h3 className="text-xs font-semibold text-heading mb-3">Training Split</h3>
          <div className="space-y-2">
            {intentData.map(({ intent, count }) => {
              const pct = totalWorkouts > 0 ? (count / totalWorkouts) * 100 : 0;
              return (
                <div key={intent}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-sub capitalize">{intent}</span>
                    <span className="text-xs text-dim">{count} ({Math.round(pct)}%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-inner rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-accent to-accent-secondary rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
