'use client';

import { useState, useEffect } from 'react';
import { useHealth } from '@/store/useHealth';

const QUALITY_LABELS = ['', 'Poor', 'Fair', 'Okay', 'Good', 'Excellent'];

export default function SleepLogger() {
  const { sleep, date, saveSleep, loading } = useHealth();
  const [hours, setHours] = useState(7);
  const [quality, setQuality] = useState(3);
  const [bedTime, setBedTime] = useState('23:00');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Populate form from existing data
  useEffect(() => {
    if (sleep) {
      setHours(Number(sleep.hours_slept));
      setQuality(sleep.quality);
      setBedTime(sleep.bed_time || '23:00');
      setWakeTime(sleep.wake_time || '07:00');
      setNotes(sleep.notes || '');
    } else {
      setHours(7);
      setQuality(3);
      setBedTime('23:00');
      setWakeTime('07:00');
      setNotes('');
    }
  }, [sleep, date]);

  const handleSave = async () => {
    setSaving(true);
    await saveSleep({
      hours_slept: hours,
      quality,
      bed_time: bedTime || null,
      wake_time: wakeTime || null,
      notes: notes || null,
    });
    setSaving(false);
  };

  return (
    <div className="space-y-5">
      {/* Hours slider */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-dim uppercase tracking-wide">Hours slept</label>
          <span className="text-lg font-bold text-heading">{hours}h</span>
        </div>
        <input
          type="range"
          min={0}
          max={14}
          step={0.5}
          value={hours}
          onChange={(e) => setHours(Number(e.target.value))}
          className="w-full accent-[var(--accent)]"
        />
        <div className="flex justify-between text-[10px] text-dim mt-1">
          <span>0h</span><span>7h</span><span>14h</span>
        </div>
      </div>

      {/* Quality stars */}
      <div>
        <label className="text-xs text-dim uppercase tracking-wide mb-2 block">Quality</label>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setQuality(star)}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                star <= quality
                  ? 'bg-accent text-white scale-105'
                  : 'bg-elevated text-dim hover:bg-inner'
              }`}
            >
              <svg className="w-5 h-5" fill={star <= quality ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </button>
          ))}
          <span className="text-sm text-sub ml-2">{QUALITY_LABELS[quality]}</span>
        </div>
      </div>

      {/* Bed & Wake times */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-dim uppercase tracking-wide mb-1.5 block">Bed time</label>
          <input
            type="time"
            value={bedTime}
            onChange={(e) => setBedTime(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-inner border border-edge text-heading text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-dim uppercase tracking-wide mb-1.5 block">Wake time</label>
          <input
            type="time"
            value={wakeTime}
            onChange={(e) => setWakeTime(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-inner border border-edge text-heading text-sm"
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="text-xs text-dim uppercase tracking-wide mb-1.5 block">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="How did you feel? Any dreams?"
          rows={2}
          className="w-full px-3 py-2 rounded-lg bg-inner border border-edge text-heading text-sm placeholder-dim resize-none"
        />
      </div>

      {/* Save button */}
      <button
        type="button"
        onClick={handleSave}
        disabled={saving || loading}
        className="w-full py-2.5 rounded-lg bg-gradient-to-r from-accent to-accent-secondary text-white text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-opacity"
      >
        {saving ? 'Saving...' : sleep ? 'Update Sleep Log' : 'Log Sleep'}
      </button>
    </div>
  );
}
