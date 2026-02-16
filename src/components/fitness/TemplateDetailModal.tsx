'use client';

import type { WorkoutTemplate } from '@/lib/fitness/types';
import { TRAINING_INTENT_LABELS, TRAINING_INTENT_COLORS } from '@/lib/fitness/types';

interface Props {
  template: WorkoutTemplate;
  onClose: () => void;
  onEdit: (template: WorkoutTemplate) => void;
  onArchive: (template: WorkoutTemplate) => void;
}

export default function TemplateDetailModal({ template, onClose, onEdit, onArchive }: Props) {
  const exercises = template.exercises ?? [];
  const totalSets = exercises.reduce((sum, ex) => sum + ex.target_sets, 0);
  const totalReps = exercises.reduce((sum, ex) => sum + ex.target_sets * ex.target_reps, 0);
  const totalVolume = exercises.reduce(
    (sum, ex) => sum + ex.target_sets * ex.target_reps * (ex.target_load_kg ?? 0),
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md bg-card rounded-2xl border border-edge max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 pb-0 flex-shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-heading">{template.name}</h2>
              {template.description && (
                <p className="text-xs text-sub mt-1">{template.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="text-dim hover:text-heading transition-colors flex-shrink-0 mt-0.5"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-3 mt-4">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${TRAINING_INTENT_COLORS[template.training_intent]}`}>
              {TRAINING_INTENT_LABELS[template.training_intent]}
            </span>
            <div className="flex items-center gap-3 text-xs text-sub">
              <span>{exercises.length} exercises</span>
              <span className="text-dim">|</span>
              <span>{totalSets} sets</span>
              <span className="text-dim">|</span>
              <span>{totalReps.toLocaleString()} reps</span>
            </div>
          </div>

          {totalVolume > 0 && (
            <div className="mt-2 text-xs text-dim">
              Est. volume: {totalVolume.toLocaleString()} kg
            </div>
          )}
        </div>

        {/* Exercises list */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5">
          <div className="space-y-2">
            {exercises
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((ex, i) => (
                <div key={ex.id} className="flex items-center gap-3 p-3 bg-inner rounded-lg">
                  <span className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-full bg-elevated text-[10px] font-bold text-dim">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-heading truncate">{ex.exercise_name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-sub">
                        {ex.target_sets} sets &times; {ex.target_reps} reps
                      </span>
                      {ex.target_load_kg != null && (
                        <span className="text-xs text-accent font-medium">
                          {ex.target_load_kg} kg
                        </span>
                      )}
                      {ex.target_rpe != null && (
                        <span className="text-xs text-amber-400">
                          RPE {ex.target_rpe}
                        </span>
                      )}
                    </div>
                    {ex.notes && (
                      <p className="text-[11px] text-dim mt-1 italic">{ex.notes}</p>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center gap-3 p-5 pt-0 flex-shrink-0">
          <button
            type="button"
            onClick={() => {
              onClose();
              onEdit(template);
            }}
            className="flex-1 py-2.5 text-sm font-medium text-accent bg-accent/10 border border-accent/20 rounded-lg hover:bg-accent/20 transition-colors"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onArchive(template);
            }}
            className="py-2.5 px-4 text-sm font-medium text-dim hover:text-red-400 bg-inner rounded-lg hover:bg-red-400/10 transition-colors"
          >
            Archive
          </button>
        </div>
      </div>
    </div>
  );
}
