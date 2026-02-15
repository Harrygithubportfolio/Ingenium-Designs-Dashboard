'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence } from 'framer-motion';
import { useFitnessSchedule } from '@/store/useFitnessSchedule';
import WorkoutStatusBadge from '@/components/fitness/WorkoutStatusBadge';
import TrainingIntentBadge from '@/components/fitness/TrainingIntentBadge';
import WorkoutDetailModal from '@/components/fitness/WorkoutDetailModal';
import type { WorkoutTemplate, ScheduledWorkout } from '@/lib/fitness/types';
import { scheduleWorkout } from '@/lib/fitness/mutations';

export default function SchedulePage() {
  const { weekSchedule, templates, loading, refresh, fetchTemplates } = useFitnessSchedule();
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<ScheduledWorkout | null>(null);

  useEffect(() => {
    refresh();
  }, []);

  const days = getWeekDays();

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      <header className="flex-shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/fitness-nutrition" className="text-gray-500 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-lg font-semibold text-white">Weekly Schedule</h1>
        </div>
        <button
          onClick={() => setShowScheduleModal(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] rounded-lg hover:opacity-90 transition-opacity"
        >
          + Schedule Workout
        </button>
      </header>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-[#3b82f6]/30 border-t-[#3b82f6] rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex-1 min-h-0 grid grid-cols-7 gap-2 overflow-hidden">
          {days.map((day) => {
            const dayWorkouts = weekSchedule.filter(
              (w) => w.scheduled_date === day.dateStr
            );
            const isToday = day.dateStr === new Date().toISOString().split('T')[0];

            return (
              <div
                key={day.dateStr}
                className={`flex flex-col rounded-xl border p-3 overflow-hidden ${
                  isToday
                    ? 'border-[#3b82f6]/40 bg-[#3b82f6]/5'
                    : 'border-[#2a2a33] bg-[#1a1a22]'
                }`}
              >
                <div className="text-center mb-2 flex-shrink-0">
                  <p className={`text-xs font-semibold ${isToday ? 'text-[#3b82f6]' : 'text-gray-400'}`}>
                    {day.dayName}
                  </p>
                  <p className="text-[10px] text-gray-500">{day.dateLabel}</p>
                </div>

                <div className="flex-1 min-h-0 space-y-1.5">
                  {dayWorkouts.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                      <span className="text-xs text-gray-600">Rest</span>
                    </div>
                  ) : (
                    dayWorkouts.map((w) => (
                      <button
                        type="button"
                        key={w.id}
                        onClick={() => setSelectedWorkout(w)}
                        className="w-full p-2 bg-[#14141a] rounded-lg text-left hover:bg-[#22222c] border border-transparent hover:border-[#3b82f6]/30 transition-all cursor-pointer group"
                      >
                        <p className="text-xs font-medium text-white truncate group-hover:text-[#3b82f6] transition-colors">
                          {w.template?.name ?? 'Workout'}
                        </p>
                        {w.template && (
                          <TrainingIntentBadge intent={w.template.training_intent} />
                        )}
                        <div className="mt-1">
                          <WorkoutStatusBadge status={w.status} />
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showScheduleModal && (
        <ScheduleModal
          templates={templates}
          onClose={() => setShowScheduleModal(false)}
          onScheduled={() => {
            setShowScheduleModal(false);
            refresh();
          }}
        />
      )}

      <AnimatePresence>
        {selectedWorkout && (
          <WorkoutDetailModal
            workout={selectedWorkout}
            onClose={() => setSelectedWorkout(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ScheduleModal({
  templates,
  onClose,
  onScheduled,
}: {
  templates: WorkoutTemplate[];
  onClose: () => void;
  onScheduled: () => void;
}) {
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!selectedTemplate || !date) return;
    setSaving(true);
    try {
      await scheduleWorkout(selectedTemplate, date);
      onScheduled();
    } catch (err) {
      console.error('Schedule error:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md bg-[#1a1a22] rounded-2xl border border-[#2a2a33] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Schedule Workout</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Template</label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="w-full px-3 py-2 bg-[#14141a] border border-[#2a2a33] rounded-lg text-sm text-white focus:outline-none focus:border-[#3b82f6]"
            >
              <option value="">Select a template...</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.training_intent})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-[#14141a] border border-[#2a2a33] rounded-lg text-sm text-white focus:outline-none focus:border-[#3b82f6]"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium text-gray-400 bg-[#14141a] rounded-lg hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !selectedTemplate}
            className="flex-1 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? 'Scheduling...' : 'Schedule'}
          </button>
        </div>
      </div>
    </div>
  );
}

function getWeekDays() {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return {
      dateStr: d.toISOString().split('T')[0],
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dateLabel: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    };
  });
}
