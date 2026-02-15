'use client';

import { useState } from 'react';
import type { IntakeEvent } from '@/lib/nutrition/types';
import {
  MEAL_TYPE_LABELS,
  MEAL_TYPE_ICONS,
  getEffectiveValue,
} from '@/lib/nutrition/types';
import { deleteIntakeEvent } from '@/lib/nutrition/mutations';
import { createClient } from '@/lib/supabase/client';
import ConfidenceBadge from './ConfidenceBadge';

interface Props {
  event: IntakeEvent;
  open: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

const METHOD_LABELS: Record<string, string> = {
  manual: 'Manual',
  ai_text: 'AI Text',
  photo: 'Photo',
};

export default function MealDetailModal({ event, open, onClose, onRefresh }: Props) {
  const [estimating, setEstimating] = useState(false);
  const [confirmRedo, setConfirmRedo] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!open) return null;

  const items = event.items ?? [];
  let totalCal = 0;
  let totalP = 0;
  let totalC = 0;
  let totalF = 0;

  for (const item of items) {
    totalCal += getEffectiveValue(item.estimated_calories, item.edited_calories);
    totalP += getEffectiveValue(item.estimated_protein_g, item.edited_protein_g);
    totalC += getEffectiveValue(item.estimated_carbs_g, item.edited_carbs_g);
    totalF += getEffectiveValue(item.estimated_fat_g, item.edited_fat_g);
  }

  const time = new Date(event.event_timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const needsNutrition = items.some(
    (i) =>
      (i.estimated_calories === null || i.estimated_calories === 0) &&
      (i.edited_calories === null || i.edited_calories === 0)
  );

  const hasNutrition = items.length > 0 && !needsNutrition;

  function handleRedoClick() {
    if (!confirmRedo) {
      setConfirmRedo(true);
      return;
    }
    setConfirmRedo(false);
    handleEstimateWithAi();
  }

  async function handleEstimateWithAi() {
    setEstimating(true);
    try {
      const payload = items.map((i) => ({
        id: i.id,
        food_name: i.food_name,
        portion_description: i.portion_description,
        portion_grams: i.portion_grams,
      }));

      const res = await fetch('/api/nutrition/estimate-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: payload }),
      });

      if (!res.ok) throw new Error('Estimation failed');

      const { data } = await res.json();

      // Backfill estimates into DB
      const updates = data.map((d: { item_id: string; calories: number; protein_g: number; carbs_g: number; fat_g: number; confidence_score: number }) => ({
        item_id: d.item_id,
        estimated_calories: d.calories,
        estimated_protein_g: d.protein_g,
        estimated_carbs_g: d.carbs_g,
        estimated_fat_g: d.fat_g,
        confidence_score: d.confidence_score,
      }));

      const backfillRes = await fetch('/api/nutrition/estimate-items', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });

      if (!backfillRes.ok) throw new Error('Backfill failed');

      onRefresh();
    } catch (err) {
      console.error('AI estimation error:', err);
    } finally {
      setEstimating(false);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    try {
      const supabase = createClient();
      await deleteIntakeEvent(supabase, event.id);
      onRefresh();
      onClose();
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-[#1a1a22] border border-[#2a2a33] rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2a2a33] flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xl">{MEAL_TYPE_ICONS[event.meal_type]}</span>
            <div>
              <h2 className="text-sm font-semibold text-white">
                {MEAL_TYPE_LABELS[event.meal_type]}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-gray-500">{time}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#14141a] text-gray-400 border border-[#2a2a33]">
                  {METHOD_LABELS[event.intake_method] ?? event.intake_method}
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#14141a] transition-colors text-gray-400 hover:text-white"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Notes */}
        {event.notes && (
          <div className="px-4 py-2 border-b border-[#2a2a33] flex-shrink-0">
            <p className="text-xs text-gray-400 italic line-clamp-2">{event.notes}</p>
          </div>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {items.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No items in this meal</p>
          ) : (
            items.map((item) => {
              const cal = getEffectiveValue(item.estimated_calories, item.edited_calories);
              const p = getEffectiveValue(item.estimated_protein_g, item.edited_protein_g);
              const c = getEffectiveValue(item.estimated_carbs_g, item.edited_carbs_g);
              const f = getEffectiveValue(item.estimated_fat_g, item.edited_fat_g);
              return (
                <div
                  key={item.id}
                  className="p-3 bg-[#14141a] rounded-xl border border-[#2a2a33]/50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {item.food_name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {item.portion_description && (
                          <span className="text-[10px] text-gray-500">
                            {item.portion_description}
                          </span>
                        )}
                        {item.confidence_score !== null && (
                          <ConfidenceBadge score={item.confidence_score} />
                        )}
                        {item.was_edited && (
                          <span className="text-[10px] px-1 py-0.5 rounded bg-amber-500/10 text-amber-400">
                            edited
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-white flex-shrink-0">
                      {Math.round(cal)} cal
                    </p>
                  </div>

                  <div className="flex items-center gap-4 mt-2 text-[11px]">
                    <span className="text-blue-400">P: {Math.round(p * 10) / 10}g</span>
                    <span className="text-amber-400">C: {Math.round(c * 10) / 10}g</span>
                    <span className="text-red-400">F: {Math.round(f * 10) / 10}g</span>
                    {cal === 0 && p === 0 && c === 0 && f === 0 && (
                      <span className="text-gray-600 italic">no macro data</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Totals */}
        {items.length > 0 && (
          <div className="px-4 py-3 border-t border-[#2a2a33] flex-shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 uppercase">Meal Totals</span>
              <span className="text-sm font-bold text-white">{Math.round(totalCal)} cal</span>
            </div>
            <div className="flex items-center gap-4 mt-1 text-[11px]">
              <span className="text-blue-400">P: {Math.round(totalP)}g</span>
              <span className="text-amber-400">C: {Math.round(totalC)}g</span>
              <span className="text-red-400">F: {Math.round(totalF)}g</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="px-4 py-3 border-t border-[#2a2a33] flex items-center gap-2 flex-shrink-0">
          {needsNutrition && (
            <button
              type="button"
              onClick={handleEstimateWithAi}
              disabled={estimating}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
            >
              {estimating ? (
                <>
                  <div className="w-3 h-3 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
                  Looking up nutrition...
                </>
              ) : (
                'Get Nutritional Details'
              )}
            </button>
          )}

          {hasNutrition && (
            <button
              type="button"
              onClick={handleRedoClick}
              disabled={estimating}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 ${
                confirmRedo
                  ? 'text-amber-300 bg-amber-500/15 border border-amber-500/40'
                  : 'text-gray-400 hover:text-emerald-300 bg-[#14141a] border border-[#2a2a33] hover:border-emerald-500/30'
              }`}
            >
              {estimating ? (
                <>
                  <div className="w-3 h-3 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
                  Re-analysing...
                </>
              ) : confirmRedo ? (
                'Regenerate nutritional data?'
              ) : (
                'Redo Nutritional Details'
              )}
            </button>
          )}

          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className={`flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 ${
              confirmDelete
                ? 'text-red-300 bg-red-500/20 border border-red-500/40'
                : 'text-gray-400 hover:text-red-400 bg-[#14141a] border border-[#2a2a33] hover:border-red-500/30'
            }`}
          >
            {deleting ? (
              <div className="w-3 h-3 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
            ) : confirmDelete ? (
              'Confirm Delete?'
            ) : (
              'Delete Meal'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
