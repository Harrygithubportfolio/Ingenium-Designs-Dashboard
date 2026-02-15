'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createAiTextIntake } from '@/lib/nutrition/mutations';
import { createClient } from '@/lib/supabase/client';
import { useNutritionDay } from '@/store/useNutritionDay';
import type { MealType } from '@/lib/nutrition/types';
import { MEAL_TYPE_LABELS } from '@/lib/nutrition/types';
import type { AiEstimatedItem } from '@/lib/nutrition/ai-types';
import DataSourceBadge from '@/components/nutrition/DataSourceBadge';

type Step = 'input' | 'review';

interface EditableItem {
  original: AiEstimatedItem;
  food_name: string;
  portion_description: string;
  portion_grams: string;
  calories: string;
  protein_g: string;
  carbs_g: string;
  fat_g: string;
  confidence_score: number;
  data_source: string;
}

function toEditable(item: AiEstimatedItem): EditableItem {
  return {
    original: item,
    food_name: item.food_name,
    portion_description: item.portion_description,
    portion_grams: item.portion_grams?.toString() ?? '',
    calories: Math.round(item.calories).toString(),
    protein_g: item.protein_g.toFixed(1),
    carbs_g: item.carbs_g.toFixed(1),
    fat_g: item.fat_g.toFixed(1),
    confidence_score: item.confidence_score,
    data_source: item.data_source,
  };
}

export default function AiLogPage() {
  const router = useRouter();
  const { refresh } = useNutritionDay();

  const [step, setStep] = useState<Step>('input');
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<EditableItem[]>([]);
  const [estimating, setEstimating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mealTypes = Object.entries(MEAL_TYPE_LABELS) as [MealType, string][];

  // --- Estimate ---
  const handleEstimate = async () => {
    if (!description.trim()) return;
    setEstimating(true);
    setError(null);
    try {
      const res = await fetch('/api/nutrition/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: description.trim(), meal_type: mealType }),
      });
      const json = await res.json();
      if (json.error) {
        setError(json.error.message);
        return;
      }
      setItems(json.data.items.map(toEditable));
      setStep('review');
    } catch {
      setError('Failed to connect to estimation service');
    } finally {
      setEstimating(false);
    }
  };

  // --- Item editing ---
  const updateItem = (index: number, field: keyof EditableItem, value: string) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const addBlankItem = () => {
    const blank: AiEstimatedItem = {
      food_name: '',
      portion_description: '',
      portion_grams: null,
      calories: 0,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0,
      confidence_score: 1.0,
      data_source: 'claude',
    };
    setItems((prev) => [...prev, toEditable(blank)]);
  };

  // --- Save ---
  const handleSave = async () => {
    const validItems = items.filter((item) => item.food_name.trim());
    if (validItems.length === 0) return;

    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      await createAiTextIntake(supabase, user.id, {
        meal_type: mealType,
        raw_description: description,
        items: validItems.map((item) => ({
          food_name: item.food_name.trim(),
          portion_description: item.portion_description,
          portion_grams: parseFloat(item.portion_grams) || null,
          calories: parseFloat(item.calories) || 0,
          protein_g: parseFloat(item.protein_g) || 0,
          carbs_g: parseFloat(item.carbs_g) || 0,
          fat_g: parseFloat(item.fat_g) || 0,
          confidence_score: item.confidence_score,
          data_source: item.data_source as AiEstimatedItem['data_source'],
        })),
      });
      await refresh();
      router.push('/fitness-nutrition');
    } catch (err) {
      console.error('Save AI intake error:', err);
      setError('Failed to save meal');
    } finally {
      setSaving(false);
    }
  };

  // --- Totals ---
  const totalCal = items.reduce((s, i) => s + (parseFloat(i.calories) || 0), 0);
  const totalP = items.reduce((s, i) => s + (parseFloat(i.protein_g) || 0), 0);
  const totalC = items.reduce((s, i) => s + (parseFloat(i.carbs_g) || 0), 0);
  const totalF = items.reduce((s, i) => s + (parseFloat(i.fat_g) || 0), 0);

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      <header className="flex-shrink-0 flex items-center gap-3">
        <Link href="/fitness-nutrition" className="text-dim hover:text-heading transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
            <svg className="w-3.5 h-3.5 text-heading" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-heading">AI Meal Log</h1>
        </div>
      </header>

      {error && (
        <div className="flex-shrink-0 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
          {error}
          <button type="button" onClick={() => setError(null)} className="ml-2 text-red-300 hover:text-heading">
            Dismiss
          </button>
        </div>
      )}

      {step === 'input' ? (
        <InputStep
          mealType={mealType}
          mealTypes={mealTypes}
          setMealType={setMealType}
          description={description}
          setDescription={setDescription}
          estimating={estimating}
          onEstimate={handleEstimate}
        />
      ) : (
        <ReviewStep
          items={items}
          totalCal={totalCal}
          totalP={totalP}
          totalC={totalC}
          totalF={totalF}
          saving={saving}
          onUpdateItem={updateItem}
          onRemoveItem={removeItem}
          onAddItem={addBlankItem}
          onSave={handleSave}
          onBack={() => setStep('input')}
        />
      )}
    </div>
  );
}

// ─── Input Step ─────────────────────────────────────────

function InputStep({
  mealType,
  mealTypes,
  setMealType,
  description,
  setDescription,
  estimating,
  onEstimate,
}: {
  mealType: MealType;
  mealTypes: [MealType, string][];
  setMealType: (v: MealType) => void;
  description: string;
  setDescription: (v: string) => void;
  estimating: boolean;
  onEstimate: () => void;
}) {
  return (
    <div className="flex-1 min-h-0 flex items-center justify-center">
      <div className="w-full max-w-lg bg-card rounded-2xl border border-edge p-6 space-y-5">
        {/* Meal Type */}
        <div>
          <label className="block text-xs text-sub mb-2">Meal Type</label>
          <div className="flex flex-wrap gap-2">
            {mealTypes.map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setMealType(value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  mealType === value
                    ? 'bg-accent/20 text-accent border border-accent/40'
                    : 'bg-inner text-sub border border-edge hover:border-accent/20'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs text-sub mb-1">Describe your meal</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="e.g. Grilled chicken breast with brown rice and steamed broccoli, glass of orange juice"
            className="w-full px-3 py-2.5 bg-inner border border-edge rounded-lg text-sm text-heading placeholder:text-dim focus:outline-none focus:border-accent resize-none"
          />
        </div>

        {/* Estimate Button */}
        <button
          type="button"
          onClick={onEstimate}
          disabled={estimating || !description.trim()}
          className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {estimating ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Estimating...
            </>
          ) : (
            'Estimate with AI'
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Review Step ────────────────────────────────────────

function ReviewStep({
  items,
  totalCal,
  totalP,
  totalC,
  totalF,
  saving,
  onUpdateItem,
  onRemoveItem,
  onAddItem,
  onSave,
  onBack,
}: {
  items: EditableItem[];
  totalCal: number;
  totalP: number;
  totalC: number;
  totalF: number;
  saving: boolean;
  onUpdateItem: (index: number, field: keyof EditableItem, value: string) => void;
  onRemoveItem: (index: number) => void;
  onAddItem: () => void;
  onSave: () => void;
  onBack: () => void;
}) {
  return (
    <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4 overflow-hidden">
      {/* Left: Estimated items */}
      <div className="flex-1 bg-card rounded-2xl border border-edge p-5 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between flex-shrink-0 mb-4">
          <h2 className="text-sm font-semibold text-heading">Estimated Items</h2>
          <button
            type="button"
            onClick={onBack}
            className="text-xs text-dim hover:text-accent transition-colors"
          >
            Re-estimate
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1">
          {items.map((item, i) => (
            <div key={i} className="p-3 bg-inner rounded-xl space-y-2">
              {/* Header: name + badges + remove */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={item.food_name}
                  onChange={(e) => onUpdateItem(i, 'food_name', e.target.value)}
                  placeholder="Food name"
                  className="flex-1 px-3 py-2 bg-elevated rounded-lg text-sm text-heading placeholder:text-dim focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <DataSourceBadge source={item.data_source} />
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemoveItem(i)}
                    aria-label="Remove item"
                    className="text-dim hover:text-red-400 transition-colors p-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Portion */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={item.portion_description}
                  onChange={(e) => onUpdateItem(i, 'portion_description', e.target.value)}
                  placeholder="Portion (e.g. 200g)"
                  className="flex-1 px-2 py-1.5 bg-elevated rounded text-xs text-heading placeholder:text-dim focus:outline-none"
                />
                <span className="text-[10px] text-dim">
                  {Math.round(item.confidence_score * 100)}% conf
                </span>
              </div>

              {/* Macros grid */}
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="text-[10px] text-dim">Cal</label>
                  <input
                    type="number"
                    value={item.calories}
                    onChange={(e) => onUpdateItem(i, 'calories', e.target.value)}
                    aria-label="Calories"
                    className="w-full px-2 py-1.5 bg-elevated rounded text-xs text-heading text-center placeholder:text-dim focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-blue-400">P (g)</label>
                  <input
                    type="number"
                    value={item.protein_g}
                    onChange={(e) => onUpdateItem(i, 'protein_g', e.target.value)}
                    aria-label="Protein in grams"
                    className="w-full px-2 py-1.5 bg-elevated rounded text-xs text-heading text-center placeholder:text-dim focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-amber-400">C (g)</label>
                  <input
                    type="number"
                    value={item.carbs_g}
                    onChange={(e) => onUpdateItem(i, 'carbs_g', e.target.value)}
                    aria-label="Carbs in grams"
                    className="w-full px-2 py-1.5 bg-elevated rounded text-xs text-heading text-center placeholder:text-dim focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-red-400">F (g)</label>
                  <input
                    type="number"
                    value={item.fat_g}
                    onChange={(e) => onUpdateItem(i, 'fat_g', e.target.value)}
                    aria-label="Fat in grams"
                    className="w-full px-2 py-1.5 bg-elevated rounded text-xs text-heading text-center placeholder:text-dim focus:outline-none"
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={onAddItem}
            className="w-full py-2 border border-dashed border-edge rounded-xl text-xs text-dim hover:text-accent hover:border-accent/30 transition-colors"
          >
            + Add Item
          </button>
        </div>
      </div>

      {/* Right: Summary */}
      <div className="lg:w-64 bg-card rounded-2xl border border-edge p-5 flex flex-col justify-between flex-shrink-0">
        <div>
          <h3 className="text-sm font-semibold text-heading mb-4">Meal Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-sub">Calories</span>
              <span className="text-sm font-semibold text-heading">{Math.round(totalCal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-blue-400">Protein</span>
              <span className="text-sm font-semibold text-heading">{Math.round(totalP)}g</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-amber-400">Carbs</span>
              <span className="text-sm font-semibold text-heading">{Math.round(totalC)}g</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-red-400">Fat</span>
              <span className="text-sm font-semibold text-heading">{Math.round(totalF)}g</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onSave}
          disabled={saving || items.every((i) => !i.food_name.trim())}
          className="w-full py-3 mt-4 bg-gradient-to-r from-accent to-accent-secondary text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Meal'}
        </button>
      </div>
    </div>
  );
}
