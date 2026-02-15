'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useFitnessSchedule } from '@/store/useFitnessSchedule';
import TemplateCard from '@/components/fitness/TemplateCard';
import type { WorkoutTemplate, CreateTemplateInput, TrainingIntent } from '@/lib/fitness/types';
import { createTemplate, archiveTemplate } from '@/lib/fitness/mutations';
import { createClient } from '@/lib/supabase/client';

export default function TemplatesPage() {
  const { templates, fetchTemplates } = useFitnessSchedule();
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates().finally(() => setLoading(false));
  }, []);

  const handleArchive = async (template: WorkoutTemplate) => {
    if (!confirm(`Archive "${template.name}"?`)) return;
    const supabase = createClient();
    await archiveTemplate(supabase, template.id);
    await fetchTemplates();
  };

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      <header className="flex-shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/fitness-nutrition" className="text-gray-500 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-lg font-semibold text-white">Workout Templates</h1>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] rounded-lg hover:opacity-90 transition-opacity"
        >
          + New Template
        </button>
      </header>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-[#3b82f6]/30 border-t-[#3b82f6] rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-hidden">
          {templates.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-3">
              <p className="text-sm text-gray-500">No templates yet</p>
              <button
                onClick={() => setShowCreate(true)}
                className="px-4 py-2 text-xs font-medium text-[#3b82f6] border border-[#3b82f6]/30 rounded-lg hover:bg-[#3b82f6]/10 transition-colors"
              >
                Create Your First Template
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 h-full overflow-hidden">
              {templates.map((t) => (
                <TemplateCard
                  key={t.id}
                  template={t}
                  onEdit={(tmpl) => handleArchive(tmpl)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {showCreate && (
        <CreateTemplateModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            fetchTemplates();
          }}
        />
      )}
    </div>
  );
}

// ============================================
// CREATE TEMPLATE MODAL
// ============================================

function CreateTemplateModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState('');
  const [intent, setIntent] = useState<TrainingIntent>('strength');
  const [description, setDescription] = useState('');
  const [exercises, setExercises] = useState<
    { exercise_name: string; target_sets: number; target_reps: number; target_load_kg: string }[]
  >([{ exercise_name: '', target_sets: 3, target_reps: 10, target_load_kg: '' }]);
  const [saving, setSaving] = useState(false);

  const addExercise = () => {
    setExercises((prev) => [
      ...prev,
      { exercise_name: '', target_sets: 3, target_reps: 10, target_load_kg: '' },
    ]);
  };

  const removeExercise = (index: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const updateExercise = (index: number, field: string, value: string | number) => {
    setExercises((prev) =>
      prev.map((ex, i) => (i === index ? { ...ex, [field]: value } : ex))
    );
  };

  const handleSubmit = async () => {
    if (!name.trim() || exercises.length === 0) return;
    setSaving(true);
    try {
      const input: CreateTemplateInput = {
        name: name.trim(),
        training_intent: intent,
        description: description.trim() || undefined,
        exercises: exercises
          .filter((ex) => ex.exercise_name.trim())
          .map((ex, i) => ({
            exercise_name: ex.exercise_name.trim(),
            sort_order: i,
            target_sets: ex.target_sets,
            target_reps: ex.target_reps,
            target_load_kg: ex.target_load_kg ? parseFloat(ex.target_load_kg) : undefined,
          })),
      };
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      await createTemplate(supabase, user.id, input);
      onCreated();
    } catch (err) {
      console.error('Create template error:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg bg-[#1a1a22] rounded-2xl border border-[#2a2a33] p-6 max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <h2 className="text-lg font-semibold text-white">New Template</h2>
          <button onClick={onClose} aria-label="Close modal" className="text-gray-500 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Template Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Push Day"
              className="w-full px-3 py-2 bg-[#14141a] border border-[#2a2a33] rounded-lg text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#3b82f6]"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Training Intent</label>
            <select
              value={intent}
              onChange={(e) => setIntent(e.target.value as TrainingIntent)}
              aria-label="Select training intent"
              className="w-full px-3 py-2 bg-[#14141a] border border-[#2a2a33] rounded-lg text-sm text-white focus:outline-none focus:border-[#3b82f6]"
            >
              <option value="strength">Strength</option>
              <option value="hypertrophy">Hypertrophy</option>
              <option value="recovery">Recovery</option>
              <option value="conditioning">Conditioning</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Description (optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description..."
              className="w-full px-3 py-2 bg-[#14141a] border border-[#2a2a33] rounded-lg text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#3b82f6]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-gray-400">Exercises</label>
              <button
                onClick={addExercise}
                className="text-xs text-[#3b82f6] hover:text-[#3b82f6]/80 transition-colors"
              >
                + Add Exercise
              </button>
            </div>
            <div className="space-y-2">
              {exercises.map((ex, i) => (
                <div key={i} className="flex items-center gap-2 p-2 bg-[#14141a] rounded-lg">
                  <input
                    type="text"
                    value={ex.exercise_name}
                    onChange={(e) => updateExercise(i, 'exercise_name', e.target.value)}
                    placeholder="Exercise name"
                    className="flex-1 px-2 py-1.5 bg-transparent text-sm text-white placeholder:text-gray-600 focus:outline-none"
                  />
                  <input
                    type="number"
                    value={ex.target_sets}
                    onChange={(e) => updateExercise(i, 'target_sets', parseInt(e.target.value) || 1)}
                    className="w-12 px-1 py-1.5 bg-[#22222c] rounded text-sm text-white text-center focus:outline-none"
                    min={1}
                    title="Sets"
                  />
                  <span className="text-xs text-gray-500">&times;</span>
                  <input
                    type="number"
                    value={ex.target_reps}
                    onChange={(e) => updateExercise(i, 'target_reps', parseInt(e.target.value) || 1)}
                    className="w-12 px-1 py-1.5 bg-[#22222c] rounded text-sm text-white text-center focus:outline-none"
                    min={1}
                    title="Reps"
                  />
                  <input
                    type="text"
                    value={ex.target_load_kg}
                    onChange={(e) => updateExercise(i, 'target_load_kg', e.target.value)}
                    placeholder="kg"
                    className="w-14 px-1 py-1.5 bg-[#22222c]/50 rounded text-sm text-white text-center placeholder:text-gray-700 focus:outline-none border border-dashed border-[#2a2a33]"
                    title="Weight in kg (optional)"
                  />
                  {exercises.length > 1 && (
                    <button
                      onClick={() => removeExercise(i)}
                      aria-label="Remove exercise"
                      className="text-gray-600 hover:text-red-400 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-[#2a2a33] flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium text-gray-400 bg-[#14141a] rounded-lg hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !name.trim()}
            className="flex-1 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? 'Creating...' : 'Create Template'}
          </button>
        </div>
      </div>
    </div>
  );
}
