'use client';

import { useState } from 'react';
import { useHabits } from '@/store/useHabits';
import type { HabitFrequency, AutoSource } from '@/lib/habits/types';

const COLOURS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#f97316'];
const ICONS = ['💪', '📖', '🧘', '💧', '🏃', '🍎', '✍️', '🎯', '😴', '🧠'];
const AUTO_SOURCES: { key: AutoSource; label: string }[] = [
  { key: null, label: 'Manual' },
  { key: 'workout_logged', label: 'Workout logged' },
  { key: 'meals_logged', label: 'Meals logged (3+)' },
  { key: 'sleep_logged', label: 'Sleep logged' },
  { key: 'hydration_target', label: 'Hydration target hit' },
  { key: 'focus_session', label: 'Focus session completed' },
];

interface HabitFormProps {
  onClose: () => void;
}

export default function HabitForm({ onClose }: HabitFormProps) {
  const { addHabit } = useHabits();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [colour, setColour] = useState('#3b82f6');
  const [icon, setIcon] = useState('');
  const [frequency, setFrequency] = useState<HabitFrequency>('daily');
  const [autoSource, setAutoSource] = useState<AutoSource>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    await addHabit({
      name: name.trim(),
      description: description || null,
      colour,
      icon: icon || null,
      frequency,
      auto_source: autoSource,
    });
    setSaving(false);
    onClose();
  };

  return (
    <div className="bg-card border border-edge rounded-2xl p-5 space-y-4">
      <h3 className="text-sm font-semibold text-heading">New Habit</h3>

      {/* Name */}
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Habit name"
        className="w-full px-3 py-2 rounded-lg bg-inner border border-edge text-heading text-sm placeholder-dim"
        autoFocus
      />

      {/* Description */}
      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
        className="w-full px-3 py-2 rounded-lg bg-inner border border-edge text-heading text-sm placeholder-dim"
      />

      {/* Icon selector */}
      <div>
        <label className="text-xs text-dim uppercase tracking-wide mb-1.5 block">Icon</label>
        <div className="flex flex-wrap gap-1.5">
          {ICONS.map((ic) => (
            <button
              key={ic}
              type="button"
              onClick={() => setIcon(icon === ic ? '' : ic)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all ${
                icon === ic ? 'bg-accent/20 ring-1 ring-accent scale-110' : 'bg-elevated hover:bg-inner'
              }`}
            >
              {ic}
            </button>
          ))}
        </div>
      </div>

      {/* Colour selector */}
      <div>
        <label className="text-xs text-dim uppercase tracking-wide mb-1.5 block">Colour</label>
        <div className="flex gap-2">
          {COLOURS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColour(c)}
              className={`w-7 h-7 rounded-full transition-all ${
                colour === c ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      {/* Frequency */}
      <div>
        <label className="text-xs text-dim uppercase tracking-wide mb-1.5 block">Frequency</label>
        <div className="flex gap-2">
          {(['daily', 'weekdays', 'weekends'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFrequency(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                frequency === f ? 'bg-accent text-white' : 'bg-elevated text-sub hover:text-heading'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Auto-source */}
      <div>
        <label className="text-xs text-dim uppercase tracking-wide mb-1.5 block">Auto-complete from</label>
        <select
          value={autoSource || ''}
          onChange={(e) => setAutoSource((e.target.value || null) as AutoSource)}
          className="w-full px-3 py-2 rounded-lg bg-inner border border-edge text-heading text-sm"
        >
          {AUTO_SOURCES.map((s) => (
            <option key={s.key || 'manual'} value={s.key || ''}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-2 rounded-lg bg-elevated text-sub text-sm font-medium hover:text-heading transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!name.trim() || saving}
          className="flex-1 py-2 rounded-lg bg-gradient-to-r from-accent to-accent-secondary text-white text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-opacity"
        >
          {saving ? 'Creating...' : 'Create Habit'}
        </button>
      </div>
    </div>
  );
}
