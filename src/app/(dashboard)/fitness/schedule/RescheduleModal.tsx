'use client';

import { useState } from 'react';
import { rescheduleWorkout } from '@/lib/fitness/mutations';
import { createClient } from '@/lib/supabase/client';
import type { ScheduledWorkout } from '@/lib/fitness/types';

interface Props {
  workout: ScheduledWorkout;
  open: boolean;
  onClose: () => void;
  onRescheduled: () => void;
}

export default function RescheduleModal({ workout, open, onClose, onRescheduled }: Props) {
  const [newDate, setNewDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const currentDate = new Date(workout.scheduled_date).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const handleSubmit = async () => {
    if (!newDate) return;
    setSaving(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      await rescheduleWorkout(supabase, user.id, workout.id, newDate);
      onRescheduled();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-sm mx-4 bg-[#1a1a22] border border-[#2a2a33] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white">Reschedule Workout</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Workout</p>
            <p className="text-sm text-white font-medium">{workout.template?.name ?? 'Workout'}</p>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-1">Currently scheduled</p>
            <p className="text-sm text-gray-300">{currentDate}</p>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">New date</label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full px-3 py-2 bg-[#14141a] border border-[#2a2a33] rounded-lg text-sm text-white focus:outline-none focus:border-[#3b82f6]"
            />
          </div>

          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}
        </div>

        <div className="flex items-center gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium text-gray-400 bg-[#14141a] rounded-lg hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || !newDate}
            className="flex-1 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? 'Rescheduling...' : 'Reschedule'}
          </button>
        </div>
      </div>
    </div>
  );
}
