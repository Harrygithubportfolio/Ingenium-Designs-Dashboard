'use client';

import { useState, useEffect, useCallback } from 'react';
import { TrendLineChart } from '@/components/shared/charts';

interface Measurement {
  id: string;
  measured_date: string;
  weight_kg: number | null;
  body_fat_pct: number | null;
  chest_cm: number | null;
  waist_cm: number | null;
  hips_cm: number | null;
  left_arm_cm: number | null;
  right_arm_cm: number | null;
  left_thigh_cm: number | null;
  right_thigh_cm: number | null;
  neck_cm: number | null;
  shoulders_cm: number | null;
  notes: string | null;
}

const FIELDS = [
  { key: 'weight_kg', label: 'Weight (kg)', required: true },
  { key: 'body_fat_pct', label: 'Body Fat (%)' },
  { key: 'chest_cm', label: 'Chest (cm)' },
  { key: 'waist_cm', label: 'Waist (cm)' },
  { key: 'hips_cm', label: 'Hips (cm)' },
  { key: 'shoulders_cm', label: 'Shoulders (cm)' },
  { key: 'neck_cm', label: 'Neck (cm)' },
  { key: 'left_arm_cm', label: 'Left Arm (cm)' },
  { key: 'right_arm_cm', label: 'Right Arm (cm)' },
  { key: 'left_thigh_cm', label: 'Left Thigh (cm)' },
  { key: 'right_thigh_cm', label: 'Right Thigh (cm)' },
] as const;

const CHART_METRICS = ['weight_kg', 'body_fat_pct', 'waist_cm', 'chest_cm'] as const;

export default function MeasurementsPage() {
  const [history, setHistory] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [chartMetric, setChartMetric] = useState<string>('weight_kg');

  // Form state
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [form, setForm] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/measurements');
      if (res.ok) {
        const json = await res.json();
        setHistory(json.data ?? []);
      }
    } catch {
      // Silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleSave = async () => {
    setSaving(true);
    const body: Record<string, unknown> = { measured_date: date, notes: notes || null };
    for (const f of FIELDS) {
      const val = form[f.key];
      body[f.key] = val ? Number(val) : null;
    }

    try {
      const res = await fetch('/api/measurements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setForm({});
        setNotes('');
        await fetchHistory();
      }
    } catch {
      // Silent
    } finally {
      setSaving(false);
    }
  };

  // Chart data
  const chartData = history
    .filter((m) => m[chartMetric as keyof Measurement] != null)
    .map((m) => ({
      date: new Date(m.measured_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      value: Number(m[chartMetric as keyof Measurement]),
    }));

  // Latest vs previous delta
  const latest = history.length > 0 ? history[history.length - 1] : null;
  const previous = history.length > 1 ? history[history.length - 2] : null;

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div>
          <h1 className="text-lg font-semibold text-heading">Body Measurements</h1>
          <p className="text-dim text-[11px]">Track your progress over time</p>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left: Form */}
          <div className="bg-gradient-to-br from-card to-inner rounded-2xl border border-edge p-5 space-y-4">
            <h3 className="text-sm font-semibold text-heading">Log Measurement</h3>

            <div>
              <label className="text-xs text-dim uppercase tracking-wide mb-1 block">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-inner border border-edge text-heading text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {FIELDS.map((f) => (
                <div key={f.key}>
                  <label className="text-[10px] text-dim uppercase tracking-wide mb-1 block">{f.label}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={form[f.key] || ''}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    placeholder="—"
                    className="w-full px-3 py-2 rounded-lg bg-inner border border-edge text-heading text-sm placeholder-dim"
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="text-[10px] text-dim uppercase tracking-wide mb-1 block">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any observations..."
                rows={2}
                className="w-full px-3 py-2 rounded-lg bg-inner border border-edge text-heading text-sm placeholder-dim resize-none"
              />
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-accent to-accent-secondary text-white text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              {saving ? 'Saving...' : 'Save Measurement'}
            </button>
          </div>

          {/* Right: Charts + Latest */}
          <div className="space-y-4">
            {/* Latest measurement summary */}
            {latest && (
              <div className="bg-gradient-to-br from-card to-inner rounded-2xl border border-edge p-5">
                <h3 className="text-sm font-semibold text-heading mb-3">Latest ({latest.measured_date})</h3>
                <div className="grid grid-cols-3 gap-3">
                  {latest.weight_kg && (
                    <div className="text-center">
                      <p className="text-xl font-bold text-heading">{Number(latest.weight_kg).toFixed(1)}</p>
                      <p className="text-[10px] text-dim">kg</p>
                      {previous?.weight_kg && (
                        <p className={`text-[10px] font-medium ${Number(latest.weight_kg) < Number(previous.weight_kg) ? 'text-green-400' : 'text-red-400'}`}>
                          {(Number(latest.weight_kg) - Number(previous.weight_kg)).toFixed(1)}kg
                        </p>
                      )}
                    </div>
                  )}
                  {latest.body_fat_pct && (
                    <div className="text-center">
                      <p className="text-xl font-bold text-heading">{Number(latest.body_fat_pct).toFixed(1)}</p>
                      <p className="text-[10px] text-dim">% body fat</p>
                    </div>
                  )}
                  {latest.waist_cm && (
                    <div className="text-center">
                      <p className="text-xl font-bold text-heading">{Number(latest.waist_cm).toFixed(1)}</p>
                      <p className="text-[10px] text-dim">cm waist</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Trend Chart */}
            <div className="bg-gradient-to-br from-card to-inner rounded-2xl border border-edge p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-heading">Trend</h3>
                <select
                  value={chartMetric}
                  onChange={(e) => setChartMetric(e.target.value)}
                  className="px-2 py-1 rounded-lg bg-inner border border-edge text-heading text-xs"
                >
                  {CHART_METRICS.map((m) => (
                    <option key={m} value={m}>{FIELDS.find((f) => f.key === m)?.label ?? m}</option>
                  ))}
                </select>
              </div>
              {chartData.length > 1 ? (
                <TrendLineChart data={chartData} xKey="date" yKey="value" height={200} />
              ) : (
                <p className="text-xs text-dim text-center py-8">Log at least 2 measurements to see trends</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
