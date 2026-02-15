'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useNutritionDay } from '@/store/useNutritionDay';
import CalorieRing from '@/components/nutrition/CalorieRing';
import MacroPieChart from '@/components/nutrition/MacroPieChart';
import IntakeEventCard from '@/components/nutrition/IntakeEventCard';

export default function NutritionPage() {
  const { date, events, summary, loading, fetchDay } = useNutritionDay();
  const [showRemaining, setShowRemaining] = useState(false);

  useEffect(() => {
    fetchDay();
  }, []);

  const consumed = summary?.consumed ?? { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };
  const targets = summary?.targets ?? { calories: 2400, protein_g: 180, carbs_g: 300, fat_g: 80 };
  const remaining = summary?.remaining ?? { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };
  const pct = targets.calories > 0 ? Math.round((consumed.calories / targets.calories) * 100) : 0;

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-heading" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-heading">Nutrition</h1>
            <p className="text-dim text-[11px]">Track what fuels you</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/nutrition/targets"
            className="px-3 py-1.5 text-xs font-medium text-sub hover:text-heading bg-card border border-edge rounded-lg hover:border-accent/40 transition-all"
          >
            Targets
          </Link>
          <Link
            href="/nutrition/log"
            className="px-4 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-accent to-accent-secondary rounded-lg hover:opacity-90 transition-opacity"
          >
            + Log Meal
          </Link>
        </div>
      </header>

      {/* Main Grid */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-hidden">
        {/* Left: Calorie Ring + Macros */}
        <div className="bg-gradient-to-br from-card to-inner rounded-2xl border border-edge p-5 flex flex-col items-center justify-center gap-4 overflow-hidden">
          {loading ? (
            <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          ) : (
            <>
              <CalorieRing consumed={consumed.calories} target={targets.calories} size={180} />
              <p className="text-sm text-sub">{pct}% of daily goal</p>

              {/* Flippable macro card */}
              <button
                onClick={() => setShowRemaining(!showRemaining)}
                className="w-full p-4 bg-inner rounded-xl hover:bg-card transition-colors"
              >
                {showRemaining ? (
                  <div>
                    <p className="text-xs text-dim uppercase mb-2">Remaining</p>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <p className="text-lg font-bold text-blue-400">+{Math.round(remaining.protein_g)}g</p>
                        <p className="text-[10px] text-dim">Protein</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-amber-400">+{Math.round(remaining.carbs_g)}g</p>
                        <p className="text-[10px] text-dim">Carbs</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-red-400">+{Math.round(remaining.fat_g)}g</p>
                        <p className="text-[10px] text-dim">Fat</p>
                      </div>
                    </div>
                    <p className="text-[10px] text-dim mt-2">Tap to see consumed</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-dim uppercase mb-2">Consumed</p>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <p className="text-lg font-bold text-blue-400">{Math.round(consumed.protein_g)}g</p>
                        <p className="text-[10px] text-dim">Protein</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-amber-400">{Math.round(consumed.carbs_g)}g</p>
                        <p className="text-[10px] text-dim">Carbs</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-red-400">{Math.round(consumed.fat_g)}g</p>
                        <p className="text-[10px] text-dim">Fat</p>
                      </div>
                    </div>
                    <p className="text-[10px] text-dim mt-2">Tap to see remaining</p>
                  </div>
                )}
              </button>
            </>
          )}
        </div>

        {/* Right: Today's Meals */}
        <div className="bg-gradient-to-br from-card to-inner rounded-2xl border border-edge p-5 flex flex-col overflow-hidden">
          <h2 className="text-sm font-semibold text-heading mb-3 flex-shrink-0">
            Today&apos;s Meals ({events.length})
          </h2>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            </div>
          ) : events.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <p className="text-sm text-dim">No meals logged today</p>
              <Link
                href="/nutrition/log"
                className="px-4 py-2 text-xs font-medium text-accent border border-accent/30 rounded-lg hover:bg-accent/10 transition-colors"
              >
                Log Your First Meal
              </Link>
            </div>
          ) : (
            <div className="flex-1 min-h-0 space-y-2 overflow-hidden">
              {events.slice(0, 6).map((event) => (
                <IntakeEventCard key={event.id} event={event} />
              ))}
              {events.length > 6 && (
                <p className="text-xs text-dim text-center">+{events.length - 6} more meals</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
