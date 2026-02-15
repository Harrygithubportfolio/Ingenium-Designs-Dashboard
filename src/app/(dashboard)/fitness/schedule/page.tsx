'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence } from 'framer-motion';
import { useFitnessSchedule } from '@/store/useFitnessSchedule';
import WorkoutDetailModal from '@/components/fitness/WorkoutDetailModal';
import type { WorkoutTemplate, ScheduledWorkout } from '@/lib/fitness/types';
import { scheduleWorkout } from '@/lib/fitness/mutations';
import { createClient } from '@/lib/supabase/client';
import WeekView from './WeekView';
import AgendaView from './AgendaView';
import MonthView from './MonthView';
import RescheduleModal from './RescheduleModal';

type ScheduleView = 'week' | 'agenda' | 'month';

function getMonday(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

export default function SchedulePage() {
  const { weekSchedule, monthSchedule, templates, loading, fetchWeek, fetchMonth, fetchTemplates } = useFitnessSchedule();

  const [activeView, setActiveView] = useState<ScheduleView>('week');
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<ScheduledWorkout | null>(null);
  const [workoutToReschedule, setWorkoutToReschedule] = useState<ScheduledWorkout | null>(null);

  // Fetch templates on mount
  useEffect(() => {
    fetchTemplates();
  }, []);

  // Fetch schedule data based on active view
  useEffect(() => {
    if (activeView === 'week' || activeView === 'agenda') {
      const from = weekStart.toISOString().split('T')[0];
      const to = new Date(weekStart.getTime() + 6 * 86400000).toISOString().split('T')[0];
      fetchWeek(from, to);
    } else {
      fetchMonth(currentYear, currentMonth);
    }
  }, [activeView, weekStart, currentMonth, currentYear]);

  const handlePrevWeek = () => {
    const prev = new Date(weekStart);
    prev.setDate(prev.getDate() - 7);
    setWeekStart(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(weekStart);
    next.setDate(next.getDate() + 7);
    setWeekStart(next);
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setSelectedDate(null);
  };

  const handleRefresh = () => {
    if (activeView === 'week' || activeView === 'agenda') {
      const from = weekStart.toISOString().split('T')[0];
      const to = new Date(weekStart.getTime() + 6 * 86400000).toISOString().split('T')[0];
      fetchWeek(from, to);
    } else {
      fetchMonth(currentYear, currentMonth);
    }
  };

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/fitness-nutrition" className="text-gray-500 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-lg font-semibold text-white">Schedule</h1>
          </div>
          <button
            type="button"
            onClick={() => setShowScheduleModal(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] rounded-lg hover:opacity-90 transition-opacity"
          >
            + Schedule
          </button>
        </div>

        {/* View toggle */}
        <div className="flex items-center bg-[#14141a] rounded-lg border border-[#2a2a33] p-0.5 w-fit">
          {(['week', 'agenda', 'month'] as const).map((view) => (
            <button
              key={view}
              type="button"
              onClick={() => setActiveView(view)}
              className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all capitalize ${
                activeView === view
                  ? 'bg-[#3b82f6]/20 text-[#3b82f6] border border-[#3b82f6]/40'
                  : 'text-gray-400 hover:text-white border border-transparent'
              }`}
            >
              {view}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-[#3b82f6]/30 border-t-[#3b82f6] rounded-full animate-spin" />
        </div>
      ) : activeView === 'week' ? (
        <WeekView
          weekStart={weekStart}
          schedule={weekSchedule}
          onSelectWorkout={setSelectedWorkout}
          onPrevWeek={handlePrevWeek}
          onNextWeek={handleNextWeek}
        />
      ) : activeView === 'agenda' ? (
        <AgendaView
          schedule={weekSchedule}
          onSelectWorkout={setSelectedWorkout}
        />
      ) : (
        <MonthView
          year={currentYear}
          month={currentMonth}
          schedule={monthSchedule}
          onSelectDate={(d) => setSelectedDate(d || null)}
          selectedDate={selectedDate}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
        />
      )}

      {/* Schedule Workout Modal */}
      {showScheduleModal && (
        <ScheduleModal
          templates={templates}
          onClose={() => setShowScheduleModal(false)}
          onScheduled={() => {
            setShowScheduleModal(false);
            handleRefresh();
          }}
        />
      )}

      {/* Workout Detail Modal */}
      <AnimatePresence>
        {selectedWorkout && (
          <WorkoutDetailModal
            workout={selectedWorkout}
            onClose={() => setSelectedWorkout(null)}
            onReschedule={() => {
              setWorkoutToReschedule(selectedWorkout);
              setSelectedWorkout(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Reschedule Modal */}
      {workoutToReschedule && (
        <RescheduleModal
          workout={workoutToReschedule}
          open={!!workoutToReschedule}
          onClose={() => setWorkoutToReschedule(null)}
          onRescheduled={() => {
            setWorkoutToReschedule(null);
            handleRefresh();
          }}
        />
      )}
    </div>
  );
}

// ─── Schedule Modal ──────────────────────────────────────────

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
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      await scheduleWorkout(supabase, user.id, selectedTemplate, date);
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
          <button type="button" onClick={onClose} aria-label="Close modal" className="text-gray-500 hover:text-white transition-colors">
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
              aria-label="Select workout template"
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
              aria-label="Select workout date"
              className="w-full px-3 py-2 bg-[#14141a] border border-[#2a2a33] rounded-lg text-sm text-white focus:outline-none focus:border-[#3b82f6]"
            />
          </div>
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
