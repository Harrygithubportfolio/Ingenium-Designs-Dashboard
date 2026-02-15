'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useNutritionDay } from '@/store/useNutritionDay';
import { createNutritionReflection } from '@/lib/nutrition/mutations';
import { fetchNutritionReflection } from '@/lib/nutrition/queries';
import { createClient } from '@/lib/supabase/client';
import type { HungerLevel, NutritionReflection } from '@/lib/nutrition/types';
import { HUNGER_LEVEL_LABELS } from '@/lib/nutrition/types';

export default function NutritionReflectionPage() {
  const router = useRouter();
  const { summary, fetchDay } = useNutritionDay();
  const [existing, setExisting] = useState<NutritionReflection | null>(null);
  const [note, setNote] = useState('');
  const [hunger, setHunger] = useState<HungerLevel | null>(null);
  const [social, setSocial] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const load = async () => {
      await fetchDay();
      const supabase = createClient();
      const ref = await fetchNutritionReflection(supabase, today);
      if (ref) {
        setExisting(ref);
        setNote(ref.reflection_note ?? '');
        setHunger(ref.hunger_level);
        setSocial(ref.social_eating_flag);
      }
      setLoading(false);
    };
    load();
  }, []);

  const consumed = summary?.consumed ?? { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };
  const targets = summary?.targets ?? { calories: 2400, protein_g: 180, carbs_g: 300, fat_g: 80 };

  const adherence = (macro: number, target: number) =>
    target > 0 ? Math.min(100, Math.round((macro / target) * 100)) : 0;

  const calAdh = adherence(consumed.calories, targets.calories);
  const proAdh = adherence(consumed.protein_g, targets.protein_g);
  const carAdh = adherence(consumed.carbs_g, targets.carbs_g);
  const fatAdh = adherence(consumed.fat_g, targets.fat_g);
  const avgAdh = Math.round((calAdh + proAdh + carAdh + fatAdh) / 4);

  const handleSave = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      await createNutritionReflection(supabase, user.id, {
        date: today,
        reflection_note: note || undefined,
        hunger_level: hunger ?? undefined,
        social_eating_flag: social,
      });
      router.push('/fitness-nutrition');
    } catch (err) {
      console.error('Reflection error:', err);
    } finally {
      setSaving(false);
    }
  };

  const hungerLevels = Object.entries(HUNGER_LEVEL_LABELS) as [HungerLevel, string][];

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      <header className="flex-shrink-0 flex items-center gap-3">
        <Link href="/fitness-nutrition" className="text-dim hover:text-heading transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-lg font-semibold text-heading">Daily Reflection</h1>
      </header>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4 overflow-hidden">
        {/* Adherence Score */}
        <div className="flex-1 bg-card rounded-2xl border border-edge p-5 flex flex-col overflow-hidden">
          <h2 className="text-sm font-semibold text-heading mb-4 flex-shrink-0">Adherence Score</h2>

          {/* Overall bar */}
          <div className="mb-4 flex-shrink-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-sub">Overall</span>
              <span className="text-sm font-bold text-heading">{avgAdh}%</span>
            </div>
            <div className="w-full h-3 bg-elevated rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-accent to-accent-secondary rounded-full transition-all duration-500"
                style={{ ['--progress-width' as string]: `${avgAdh}%`, width: 'var(--progress-width)' } as React.CSSProperties}
              />
            </div>
          </div>

          {/* Per-macro breakdown */}
          <div className="space-y-3 flex-shrink-0">
            <AdherenceRow label="Calories" consumed={consumed.calories} target={targets.calories} pct={calAdh} unit="kcal" />
            <AdherenceRow label="Protein" consumed={consumed.protein_g} target={targets.protein_g} pct={proAdh} unit="g" color="text-blue-400" />
            <AdherenceRow label="Carbs" consumed={consumed.carbs_g} target={targets.carbs_g} pct={carAdh} unit="g" color="text-amber-400" />
            <AdherenceRow label="Fat" consumed={consumed.fat_g} target={targets.fat_g} pct={fatAdh} unit="g" color="text-red-400" />
          </div>
        </div>

        {/* Reflection Input */}
        <div className="flex-1 bg-card rounded-2xl border border-edge p-5 flex flex-col overflow-hidden">
          <h2 className="text-sm font-semibold text-heading mb-4 flex-shrink-0">Your Reflection</h2>

          <div className="flex-1 space-y-4 overflow-hidden">
            {/* Hunger */}
            <div>
              <label className="block text-xs text-sub mb-2">Hunger level today</label>
              <div className="flex flex-wrap gap-2">
                {hungerLevels.map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => setHunger(value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      hunger === value
                        ? 'bg-accent/20 text-accent border border-accent/40'
                        : 'bg-inner text-sub border border-edge'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Social eating */}
            <div className="flex items-center justify-between">
              <label className="text-xs text-sub">Social eating today?</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setSocial(true)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    social
                      ? 'bg-accent/20 text-accent border border-accent/40'
                      : 'bg-inner text-sub border border-edge'
                  }`}
                >
                  Yes
                </button>
                <button
                  onClick={() => setSocial(false)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    !social
                      ? 'bg-accent/20 text-accent border border-accent/40'
                      : 'bg-inner text-sub border border-edge'
                  }`}
                >
                  No
                </button>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs text-sub mb-1">Notes</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="How did today feel nutrition-wise?"
                className="w-full px-3 py-2 bg-inner border border-edge rounded-lg text-sm text-heading placeholder:text-dim focus:outline-none focus:border-accent resize-none"
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 mt-4 bg-gradient-to-r from-accent to-accent-secondary text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex-shrink-0"
          >
            {saving ? 'Saving...' : 'Save Reflection'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AdherenceRow({
  label,
  consumed,
  target,
  pct,
  unit,
  color = 'text-heading',
}: {
  label: string;
  consumed: number;
  target: number;
  pct: number;
  unit: string;
  color?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className={`text-xs ${color}`}>{label}</span>
        <span className="text-xs text-sub">
          {Math.round(consumed)} / {Math.round(target)} {unit} ({pct}%)
        </span>
      </div>
      <div className="w-full h-1.5 bg-elevated rounded-full overflow-hidden">
        <div
          className="h-full bg-accent rounded-full transition-all duration-300"
          style={{ ['--progress-width' as string]: `${Math.min(100, pct)}%`, width: 'var(--progress-width)' } as React.CSSProperties}
        />
      </div>
    </div>
  );
}
