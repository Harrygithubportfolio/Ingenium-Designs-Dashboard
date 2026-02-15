'use client';

import { useHealth } from '@/store/useHealth';
import { ProgressRing } from '@/components/shared/charts';

const QUICK_ADD = [
  { label: '+250ml', ml: 250, icon: '🥤' },
  { label: '+500ml', ml: 500, icon: '🫗' },
  { label: '+750ml', ml: 750, icon: '🍶' },
  { label: '+1L', ml: 1000, icon: '🧊' },
];

export default function HydrationTracker() {
  const { hydration, addWater, loading } = useHealth();
  const total = hydration?.total_ml ?? 0;
  const target = hydration?.target_ml ?? 2500;
  const entries = hydration?.entries ?? [];
  const pct = target > 0 ? Math.min(Math.round((total / target) * 100), 100) : 0;

  return (
    <div className="space-y-5">
      {/* Progress ring */}
      <div className="flex items-center justify-center py-4">
        <ProgressRing
          value={total}
          max={target}
          size={160}
          strokeWidth={10}
          label={`${pct}%`}
          sublabel={`${total}ml / ${target}ml`}
        />
      </div>

      {/* Quick-add buttons */}
      <div className="grid grid-cols-4 gap-2">
        {QUICK_ADD.map((btn) => (
          <button
            key={btn.ml}
            type="button"
            onClick={() => addWater(btn.ml)}
            disabled={loading}
            className="flex flex-col items-center gap-1 py-3 rounded-xl bg-inner border border-edge hover:border-accent/40 hover:bg-elevated transition-all disabled:opacity-40"
          >
            <span className="text-lg">{btn.icon}</span>
            <span className="text-xs font-medium text-heading">{btn.label}</span>
          </button>
        ))}
      </div>

      {/* Today's log */}
      {entries.length > 0 && (
        <div>
          <h4 className="text-xs text-dim uppercase tracking-wide mb-2">Today&apos;s entries</h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {entries.slice().reverse().map((entry, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-inner">
                <span className="text-xs text-dim">{entry.time}</span>
                <span className="text-sm font-medium text-heading">{entry.ml}ml</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary bar */}
      <div className="bg-inner rounded-xl p-3 flex items-center justify-between">
        <span className="text-xs text-dim">Remaining</span>
        <span className="text-sm font-bold text-heading">
          {Math.max(target - total, 0)}ml to go
        </span>
      </div>
    </div>
  );
}
