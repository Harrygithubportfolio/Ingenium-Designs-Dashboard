'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useNutritionDay } from '@/store/useNutritionDay';
import { upsertDailyTargets } from '@/lib/nutrition/mutations';
import { createClient } from '@/lib/supabase/client';
import type { DayType } from '@/lib/nutrition/types';
import { DAY_TYPE_LABELS } from '@/lib/nutrition/types';

export default function TargetsPage() {
  const { targets, fetchDay } = useNutritionDay();
  const [dayType, setDayType] = useState<DayType>('rest');
  const [calories, setCalories] = useState('2400');
  const [protein, setProtein] = useState('180');
  const [carbs, setCarbs] = useState('300');
  const [fat, setFat] = useState('80');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchDay();
  }, []);

  useEffect(() => {
    if (targets) {
      setDayType(targets.day_type);
      setCalories(String(targets.target_calories));
      setProtein(String(targets.target_protein_g));
      setCarbs(String(targets.target_carbs_g));
      setFat(String(targets.target_fat_g));
    }
  }, [targets]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      await upsertDailyTargets(supabase, user.id, {
        target_date: new Date().toISOString().split('T')[0],
        day_type: dayType,
        target_calories: parseFloat(calories) || 0,
        target_protein_g: parseFloat(protein) || 0,
        target_carbs_g: parseFloat(carbs) || 0,
        target_fat_g: parseFloat(fat) || 0,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      await fetchDay();
    } catch (err) {
      console.error('Save targets error:', err);
    } finally {
      setSaving(false);
    }
  };

  const dayTypes = Object.entries(DAY_TYPE_LABELS) as [DayType, string][];

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      <header className="flex-shrink-0 flex items-center gap-3">
        <Link href="/fitness-nutrition" className="text-gray-500 hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-lg font-semibold text-white">Daily Targets</h1>
      </header>

      <div className="flex-1 min-h-0 flex items-center justify-center">
        <div className="w-full max-w-md bg-[#1a1a22] rounded-2xl border border-[#2a2a33] p-6 space-y-6">
          {/* Day Type */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">Day Type</label>
            <div className="flex gap-2">
              {dayTypes.map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setDayType(value)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                    dayType === value
                      ? 'bg-[#3b82f6]/20 text-[#3b82f6] border border-[#3b82f6]/40'
                      : 'bg-[#14141a] text-gray-400 border border-[#2a2a33]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Macro Targets */}
          <div className="space-y-4">
            <MacroInput label="Calories" value={calories} onChange={setCalories} unit="kcal" color="text-white" />
            <MacroInput label="Protein" value={protein} onChange={setProtein} unit="g" color="text-blue-400" />
            <MacroInput label="Carbs" value={carbs} onChange={setCarbs} unit="g" color="text-amber-400" />
            <MacroInput label="Fat" value={fat} onChange={setFat} unit="g" color="text-red-400" />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saved ? '✓ Saved!' : saving ? 'Saving...' : 'Save Targets'}
          </button>
        </div>
      </div>
    </div>
  );
}

function MacroInput({
  label,
  value,
  onChange,
  unit,
  color,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  unit: string;
  color: string;
}) {
  return (
    <div>
      <label className={`block text-xs mb-1 ${color}`}>{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={`${label} target`}
          className="flex-1 px-3 py-2 bg-[#14141a] border border-[#2a2a33] rounded-lg text-sm text-white focus:outline-none focus:border-[#3b82f6]"
        />
        <span className="text-xs text-gray-500 w-8">{unit}</span>
      </div>
    </div>
  );
}
