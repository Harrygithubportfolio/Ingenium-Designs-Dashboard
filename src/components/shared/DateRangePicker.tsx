'use client';

import { useState } from 'react';

export interface DateRange {
  from: string; // ISO date YYYY-MM-DD
  to: string;
}

type Preset = 'today' | 'this_week' | 'this_month' | 'last_7' | 'last_30' | 'custom';

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function getPresetRange(preset: Exclude<Preset, 'custom'>): DateRange {
  const now = new Date();
  const today = toISO(now);

  switch (preset) {
    case 'today':
      return { from: today, to: today };
    case 'this_week': {
      const day = now.getDay();
      const monday = new Date(now);
      monday.setDate(now.getDate() - ((day + 6) % 7));
      return { from: toISO(monday), to: today };
    }
    case 'this_month': {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: toISO(first), to: today };
    }
    case 'last_7': {
      const start = new Date(now);
      start.setDate(now.getDate() - 6);
      return { from: toISO(start), to: today };
    }
    case 'last_30': {
      const start = new Date(now);
      start.setDate(now.getDate() - 29);
      return { from: toISO(start), to: today };
    }
  }
}

const PRESETS: { key: Exclude<Preset, 'custom'>; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'this_week', label: 'This Week' },
  { key: 'this_month', label: 'This Month' },
  { key: 'last_7', label: 'Last 7 Days' },
  { key: 'last_30', label: 'Last 30 Days' },
];

export default function DateRangePicker({ value, onChange, className = '' }: DateRangePickerProps) {
  const [mode, setMode] = useState<Preset>('this_week');

  const handlePreset = (preset: Exclude<Preset, 'custom'>) => {
    setMode(preset);
    onChange(getPresetRange(preset));
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {PRESETS.map((p) => (
        <button
          key={p.key}
          type="button"
          onClick={() => handlePreset(p.key)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            mode === p.key
              ? 'bg-accent text-white'
              : 'bg-elevated text-sub hover:text-heading hover:bg-inner'
          }`}
        >
          {p.label}
        </button>
      ))}
      <button
        type="button"
        onClick={() => setMode('custom')}
        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
          mode === 'custom'
            ? 'bg-accent text-white'
            : 'bg-elevated text-sub hover:text-heading hover:bg-inner'
        }`}
      >
        Custom
      </button>
      {mode === 'custom' && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={value.from}
            onChange={(e) => onChange({ ...value, from: e.target.value })}
            className="px-2 py-1.5 rounded-lg bg-inner border border-edge text-heading text-xs"
          />
          <span className="text-dim text-xs">to</span>
          <input
            type="date"
            value={value.to}
            onChange={(e) => onChange({ ...value, to: e.target.value })}
            className="px-2 py-1.5 rounded-lg bg-inner border border-edge text-heading text-xs"
          />
        </div>
      )}
    </div>
  );
}
