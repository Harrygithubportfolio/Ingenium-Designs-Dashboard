'use client';

import type { WorkoutTemplate } from '@/lib/fitness/types';
import TrainingIntentBadge from './TrainingIntentBadge';

interface Props {
  template: WorkoutTemplate;
  onSelect?: (template: WorkoutTemplate) => void;
  onEdit?: (template: WorkoutTemplate) => void;
  onArchive?: (template: WorkoutTemplate) => void;
}

export default function TemplateCard({ template, onSelect, onEdit, onArchive }: Props) {
  const exerciseCount = template.exercises?.length ?? 0;
  const totalSets = template.exercises?.reduce((sum, ex) => sum + ex.target_sets, 0) ?? 0;

  return (
    <div
      onClick={() => onSelect?.(template)}
      className="bg-card rounded-xl border border-edge p-4 hover:border-accent/40 transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-heading truncate group-hover:text-accent transition-colors">
            {template.name}
          </h3>
          {template.description && (
            <p className="text-xs text-dim mt-0.5 truncate">{template.description}</p>
          )}
        </div>
        <TrainingIntentBadge intent={template.training_intent} />
      </div>

      <div className="flex items-center gap-4 text-xs text-sub">
        <span>{exerciseCount} exercises</span>
        <span>{totalSets} total sets</span>
      </div>

      {template.exercises && template.exercises.length > 0 && (
        <div className="mt-3 space-y-1">
          {template.exercises.slice(0, 4).map((ex) => (
            <div key={ex.id} className="flex items-center justify-between text-xs">
              <span className="text-sub truncate">{ex.exercise_name}</span>
              <span className="text-dim flex-shrink-0 ml-2">
                {ex.target_sets}×{ex.target_reps}
                {ex.target_load_kg ? ` @${ex.target_load_kg}kg` : ''}
              </span>
            </div>
          ))}
          {template.exercises.length > 4 && (
            <p className="text-xs text-dim">+{template.exercises.length - 4} more</p>
          )}
        </div>
      )}

      {(onEdit || onArchive) && (
        <div className="mt-3 flex items-center gap-3">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(template);
              }}
              className="text-xs text-accent hover:text-accent/80 transition-colors"
            >
              Edit
            </button>
          )}
          {onArchive && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onArchive(template);
              }}
              className="text-xs text-dim hover:text-red-400 transition-colors"
            >
              Archive
            </button>
          )}
        </div>
      )}
    </div>
  );
}
