import TrendLineChart from '@/components/shared/charts/TrendLineChart';
import HeatmapGrid from '@/components/shared/charts/HeatmapGrid';

interface FitnessChartsSectionProps {
  volumeTrend: { week: string; volume: number }[];
  heatmapData: Record<string, number>;
}

export default function FitnessChartsSection({
  volumeTrend,
  heatmapData,
}: FitnessChartsSectionProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Volume Trend */}
      <div className="bg-gradient-to-br from-card to-inner rounded-2xl border border-edge p-4">
        <h3 className="text-sm font-semibold text-heading mb-3">Volume Trend</h3>
        {volumeTrend.length > 1 ? (
          <TrendLineChart
            data={volumeTrend}
            xKey="week"
            yKey="volume"
            colour="var(--accent)"
            height={160}
            formatY={(v: number) => `${(v / 1000).toFixed(1)}t`}
            formatX={(v: string) => {
              const d = new Date(v);
              return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
            }}
          />
        ) : (
          <div className="h-40 flex items-center justify-center">
            <p className="text-xs text-dim">Not enough data yet</p>
          </div>
        )}
      </div>

      {/* Workout Heatmap */}
      <div className="bg-gradient-to-br from-card to-inner rounded-2xl border border-edge p-4">
        <h3 className="text-sm font-semibold text-heading mb-3">Workout Frequency</h3>
        {Object.keys(heatmapData).length > 0 ? (
          <HeatmapGrid data={heatmapData} weeks={20} colour="#3b82f6" />
        ) : (
          <div className="h-40 flex items-center justify-center">
            <p className="text-xs text-dim">No workout history yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
