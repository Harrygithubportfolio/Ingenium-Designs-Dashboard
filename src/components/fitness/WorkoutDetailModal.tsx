'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import type { ScheduledWorkout } from '@/lib/fitness/types';
import { TRAINING_INTENT_COLORS, TRAINING_INTENT_LABELS, WORKOUT_STATUS_COLORS } from '@/lib/fitness/types';
import TrainingIntentBadge from './TrainingIntentBadge';
import WorkoutStatusBadge from './WorkoutStatusBadge';

interface Props {
  workout: ScheduledWorkout;
  onClose: () => void;
  onReschedule?: () => void;
}

export default function WorkoutDetailModal({ workout, onClose, onReschedule }: Props) {
  const template = workout.template;
  const exercises = template?.exercises?.sort((a, b) => a.sort_order - b.sort_order) ?? [];
  const scheduledDate = new Date(workout.scheduled_date);
  const dateLabel = scheduledDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const isToday = workout.scheduled_date === new Date().toISOString().split('T')[0];
  const canStart = workout.status === 'scheduled' && isToday;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="w-full max-w-lg max-h-[85vh] bg-card border border-edge rounded-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-edge flex-shrink-0">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-heading truncate">
                {template?.name ?? 'Workout'}
              </h2>
              <p className="text-xs text-dim mt-1">{dateLabel}</p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="ml-3 p-1.5 text-dim hover:text-heading hover:bg-elevated rounded-lg transition-colors flex-shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex items-center gap-2">
            {template && <TrainingIntentBadge intent={template.training_intent} />}
            <WorkoutStatusBadge status={workout.status} />
            {template?.description && (
              <span className="text-xs text-dim truncate ml-1">{template.description}</span>
            )}
          </div>
        </div>

        {/* Exercise List */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5">
          {exercises.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-dim">No exercises in this template</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {exercises.map((ex, i) => (
                <div
                  key={ex.id}
                  className="bg-inner rounded-xl p-4 border border-edge/50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-elevated flex items-center justify-center text-[10px] font-bold text-sub">
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-heading">{ex.exercise_name}</p>
                        <p className="text-xs text-sub mt-0.5">
                          {ex.target_sets} sets &times; {ex.target_reps} reps
                          {ex.target_load_kg != null && (
                            <span className="text-blue-400 font-medium"> @ {ex.target_load_kg}kg</span>
                          )}
                        </p>
                      </div>
                    </div>
                    {ex.target_rpe != null && (
                      <span className="flex-shrink-0 px-2 py-0.5 text-[10px] font-semibold text-amber-400 bg-amber-400/10 rounded-md">
                        RPE {ex.target_rpe}
                      </span>
                    )}
                  </div>
                  {ex.notes && (
                    <p className="text-xs text-dim italic mt-2 ml-9">{ex.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {(canStart || onReschedule) && (
          <div className="p-5 border-t border-edge flex-shrink-0 flex items-center gap-3">
            {onReschedule && workout.status === 'scheduled' && (
              <button
                type="button"
                onClick={onReschedule}
                className="px-4 py-3 text-sm font-medium text-sub bg-inner border border-edge rounded-xl hover:text-heading hover:border-accent/30 transition-all"
              >
                Reschedule
              </button>
            )}
            {canStart && (
              <Link
                href="/gym-mode"
                className="flex-1 block py-3 bg-gradient-to-r from-accent to-accent-secondary text-white font-semibold rounded-xl text-center hover:opacity-90 transition-opacity"
              >
                Start Gym Mode
              </Link>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
