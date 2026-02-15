'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createManualIntake } from '@/lib/nutrition/mutations';
import { useNutritionDay } from '@/store/useNutritionDay';
import type { MealType } from '@/lib/nutrition/types';
import { MEAL_TYPE_LABELS } from '@/lib/nutrition/types';

interface FoodEntry {
  food_name: string;
  calories: string;
  protein_g: string;
  carbs_g: string;
  fat_g: string;
  portion_description: string;
}

const emptyEntry = (): FoodEntry => ({
  food_name: '',
  calories: '',
  protein_g: '',
  carbs_g: '',
  fat_g: '',
  portion_description: '',
});

export default function LogMealPage() {
  const router = useRouter();
  const { refresh } = useNutritionDay();
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [entries, setEntries] = useState<FoodEntry[]>([emptyEntry()]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const addEntry = () => setEntries((prev) => [...prev, emptyEntry()]);

  const removeEntry = (index: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== index));
  };

  const updateEntry = (index: number, field: keyof FoodEntry, value: string) => {
    setEntries((prev) =>
      prev.map((e, i) => (i === index ? { ...e, [field]: value } : e))
    );
  };

  const totalCal = entries.reduce((s, e) => s + (parseFloat(e.calories) || 0), 0);
  const totalP = entries.reduce((s, e) => s + (parseFloat(e.protein_g) || 0), 0);
  const totalC = entries.reduce((s, e) => s + (parseFloat(e.carbs_g) || 0), 0);
  const totalF = entries.reduce((s, e) => s + (parseFloat(e.fat_g) || 0), 0);

  const handleSave = async () => {
    const validEntries = entries.filter((e) => e.food_name.trim());
    if (validEntries.length === 0) return;
    setSaving(true);
    try {
      await createManualIntake({
        meal_type: mealType,
        items: validEntries.map((e) => ({
          food_name: e.food_name.trim(),
          portion_description: e.portion_description || undefined,
          calories: parseFloat(e.calories) || 0,
          protein_g: parseFloat(e.protein_g) || 0,
          carbs_g: parseFloat(e.carbs_g) || 0,
          fat_g: parseFloat(e.fat_g) || 0,
        })),
        notes: notes || undefined,
      });
      await refresh();
      router.push('/nutrition');
    } catch (err) {
      console.error('Log meal error:', err);
    } finally {
      setSaving(false);
    }
  };

  const mealTypes = Object.entries(MEAL_TYPE_LABELS) as [MealType, string][];

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      <header className="flex-shrink-0 flex items-center gap-3">
        <Link href="/nutrition" className="text-gray-500 hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-lg font-semibold text-white">Log Meal</h1>
      </header>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4 overflow-hidden">
        {/* Left: Input form */}
        <div className="flex-1 bg-[#1a1a22] rounded-2xl border border-[#2a2a33] p-5 flex flex-col overflow-hidden">
          {/* Meal Type */}
          <div className="flex-shrink-0 mb-4">
            <label className="block text-xs text-gray-400 mb-2">Meal Type</label>
            <div className="flex flex-wrap gap-2">
              {mealTypes.map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setMealType(value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    mealType === value
                      ? 'bg-[#3b82f6]/20 text-[#3b82f6] border border-[#3b82f6]/40'
                      : 'bg-[#14141a] text-gray-400 border border-[#2a2a33] hover:border-[#3b82f6]/20'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Food entries */}
          <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1">
            {entries.map((entry, i) => (
              <div key={i} className="p-3 bg-[#14141a] rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={entry.food_name}
                    onChange={(e) => updateEntry(i, 'food_name', e.target.value)}
                    placeholder="Food name"
                    className="flex-1 px-3 py-2 bg-[#22222c] rounded-lg text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#3b82f6]"
                  />
                  {entries.length > 1 && (
                    <button
                      onClick={() => removeEntry(i)}
                      className="text-gray-600 hover:text-red-400 transition-colors p-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={entry.portion_description}
                    onChange={(e) => updateEntry(i, 'portion_description', e.target.value)}
                    placeholder="Portion (e.g. 200g)"
                    className="flex-1 px-2 py-1.5 bg-[#22222c] rounded text-xs text-white placeholder:text-gray-600 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-500">Cal</label>
                    <input
                      type="number"
                      value={entry.calories}
                      onChange={(e) => updateEntry(i, 'calories', e.target.value)}
                      placeholder="0"
                      className="w-full px-2 py-1.5 bg-[#22222c] rounded text-xs text-white text-center placeholder:text-gray-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-blue-400">P (g)</label>
                    <input
                      type="number"
                      value={entry.protein_g}
                      onChange={(e) => updateEntry(i, 'protein_g', e.target.value)}
                      placeholder="0"
                      className="w-full px-2 py-1.5 bg-[#22222c] rounded text-xs text-white text-center placeholder:text-gray-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-amber-400">C (g)</label>
                    <input
                      type="number"
                      value={entry.carbs_g}
                      onChange={(e) => updateEntry(i, 'carbs_g', e.target.value)}
                      placeholder="0"
                      className="w-full px-2 py-1.5 bg-[#22222c] rounded text-xs text-white text-center placeholder:text-gray-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-red-400">F (g)</label>
                    <input
                      type="number"
                      value={entry.fat_g}
                      onChange={(e) => updateEntry(i, 'fat_g', e.target.value)}
                      placeholder="0"
                      className="w-full px-2 py-1.5 bg-[#22222c] rounded text-xs text-white text-center placeholder:text-gray-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={addEntry}
              className="w-full py-2 border border-dashed border-[#2a2a33] rounded-xl text-xs text-gray-500 hover:text-[#3b82f6] hover:border-[#3b82f6]/30 transition-colors"
            >
              + Add Another Item
            </button>
          </div>

          {/* Notes */}
          <div className="flex-shrink-0 mt-3">
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes (optional)"
              className="w-full px-3 py-2 bg-[#14141a] border border-[#2a2a33] rounded-lg text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#3b82f6]"
            />
          </div>
        </div>

        {/* Right: Summary */}
        <div className="lg:w-64 bg-[#1a1a22] rounded-2xl border border-[#2a2a33] p-5 flex flex-col justify-between flex-shrink-0">
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Meal Total</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-400">Calories</span>
                <span className="text-sm font-semibold text-white">{Math.round(totalCal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-blue-400">Protein</span>
                <span className="text-sm font-semibold text-white">{Math.round(totalP)}g</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-amber-400">Carbs</span>
                <span className="text-sm font-semibold text-white">{Math.round(totalC)}g</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-red-400">Fat</span>
                <span className="text-sm font-semibold text-white">{Math.round(totalF)}g</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || entries.every((e) => !e.food_name.trim())}
            className="w-full py-3 mt-4 bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Log Meal'}
          </button>
        </div>
      </div>
    </div>
  );
}
