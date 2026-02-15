'use client';

import { useEffect, useState } from 'react';
import { useHealth } from '@/store/useHealth';
import DatePicker from '@/components/shared/DatePicker';
import { BarChartCard } from '@/components/shared/charts';
import SleepLogger from './components/SleepLogger';
import HydrationTracker from './components/HydrationTracker';
import SleepChart from './components/SleepChart';

type Tab = 'sleep' | 'hydration';

export default function HealthPage() {
  const [tab, setTab] = useState<Tab>('sleep');
  const { date, setDate, fetchDay, loading } = useHealth();

  useEffect(() => {
    fetchDay();
  }, [fetchDay]);

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-heading">Health</h1>
            <p className="text-dim text-[11px]">Sleep & hydration tracking</p>
          </div>
        </div>

        <DatePicker value={date} onChange={setDate} />
      </header>

      {/* Tabs */}
      <div className="flex-shrink-0 flex gap-1 bg-inner rounded-xl p-1">
        {(['sleep', 'hydration'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              tab === t
                ? 'bg-card text-heading shadow-sm'
                : 'text-dim hover:text-sub'
            }`}
          >
            {t === 'sleep' ? '🌙 Sleep' : '💧 Hydration'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left: Logger / Tracker */}
            <div className="bg-gradient-to-br from-card to-inner rounded-2xl border border-edge p-5">
              {tab === 'sleep' ? <SleepLogger /> : <HydrationTracker />}
            </div>

            {/* Right: Charts */}
            <div className="bg-gradient-to-br from-card to-inner rounded-2xl border border-edge p-5">
              {tab === 'sleep' ? (
                <div className="space-y-4">
                  <SleepChart days={7} />
                  <SleepChart days={30} />
                </div>
              ) : (
                <div className="space-y-4">
                  <HydrationChart days={7} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// HYDRATION CHART (inline to avoid extra file)
// ============================================

function HydrationChart({ days = 7 }: { days?: number }) {
  const { hydrationHistory, fetchHydrationHistory } = useHealth();
  const [chartData, setChartData] = useState<{ date: string; ml: number }[]>([]);

  useEffect(() => {
    const to = new Date().toISOString().slice(0, 10);
    const from = new Date();
    from.setDate(from.getDate() - (days - 1));
    fetchHydrationHistory(from.toISOString().slice(0, 10), to);
  }, [days, fetchHydrationHistory]);

  useEffect(() => {
    const dateMap = new Map(hydrationHistory.map((h) => [h.log_date, h]));
    const result = [];
    const cursor = new Date();
    cursor.setDate(cursor.getDate() - (days - 1));

    for (let i = 0; i < days; i++) {
      const iso = cursor.toISOString().slice(0, 10);
      const log = dateMap.get(iso);
      result.push({
        date: cursor.toLocaleDateString('en-GB', { weekday: 'short' }),
        ml: log ? log.total_ml : 0,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    setChartData(result);
  }, [hydrationHistory, days]);

  return (
    <div>
      <h4 className="text-xs text-dim uppercase tracking-wide mb-3">Hydration — Last {days} days</h4>
      <BarChartCard
        data={chartData}
        xKey="date"
        yKey="ml"
        colour="#06b6d4"
        height={180}
        formatY={(v: number) => `${v}ml`}
      />
    </div>
  );
}
