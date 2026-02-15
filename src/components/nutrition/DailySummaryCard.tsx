'use client';

import { useEffect, useState } from 'react';
import { useGoals } from '@/store/useGoals';
import type { IntakeEvent, MacroTotals } from '@/lib/nutrition/types';

type GoalPreset = 'cut' | 'bulk' | 'maintain' | 'recomp';

const GOAL_PRESETS: { value: GoalPreset; label: string }[] = [
  { value: 'cut', label: 'Cut' },
  { value: 'bulk', label: 'Bulk' },
  { value: 'maintain', label: 'Maintain' },
  { value: 'recomp', label: 'Recomp' },
];

const RATING_STYLES: Record<string, { dot: string; label: string }> = {
  great: { dot: 'bg-green-400', label: 'Great day!' },
  good: { dot: 'bg-blue-400', label: 'Good day' },
  needs_work: { dot: 'bg-amber-400', label: 'Needs work' },
  off_track: { dot: 'bg-red-400', label: 'Off track' },
};

interface SummaryResult {
  summary: string;
  rating: string;
  tips: string[];
}

interface Props {
  events: IntakeEvent[];
  consumed: MacroTotals;
  targets: MacroTotals;
}

function inferGoalPreset(goalTitles: string[]): GoalPreset | null {
  const combined = goalTitles.join(' ').toLowerCase();
  if (combined.includes('cut') || combined.includes('lose') || combined.includes('lean') || combined.includes('shred')) return 'cut';
  if (combined.includes('bulk') || combined.includes('gain') || combined.includes('mass')) return 'bulk';
  if (combined.includes('recomp') || combined.includes('body recomposition')) return 'recomp';
  if (combined.includes('maintain') || combined.includes('sustain')) return 'maintain';
  return null;
}

export default function DailySummaryCard({ events, consumed, targets }: Props) {
  const { goals, fetchGoals } = useGoals();
  const [selectedGoal, setSelectedGoal] = useState<GoalPreset | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGoals();
  }, []);

  // Infer goal from active goals when they load
  useEffect(() => {
    if (selectedGoal !== null) return;
    const activeGoals = goals.filter((g) => g.status === 'active');
    const inferred = inferGoalPreset(activeGoals.map((g) => g.title));
    if (inferred) setSelectedGoal(inferred);
  }, [goals, selectedGoal]);

  async function handleGetFeedback() {
    setLoading(true);
    setError(null);
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch('/api/nutrition/ai-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: today,
          goal_override: selectedGoal ?? undefined,
        }),
      });

      const json = await res.json();
      if (json.error) {
        setError(json.error.message);
      } else {
        setResult(json.data);
      }
    } catch {
      setError('Failed to get AI feedback');
    } finally {
      setLoading(false);
    }
  }

  const ratingStyle = result ? RATING_STYLES[result.rating] ?? RATING_STYLES.good : null;

  return (
    <div className="mt-3 p-3 bg-inner rounded-xl border border-edge/50">
      {/* Goal selector */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] text-dim uppercase flex-shrink-0">Goal:</span>
        <div className="flex items-center gap-1 flex-wrap">
          {GOAL_PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => setSelectedGoal(preset.value)}
              className={`px-2 py-0.5 text-[10px] font-medium rounded-md transition-all ${
                selectedGoal === preset.value
                  ? 'bg-accent/20 text-accent border border-accent/40'
                  : 'text-sub hover:text-heading bg-card border border-edge'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Feedback button or result */}
      {!result ? (
        <button
          type="button"
          onClick={handleGetFeedback}
          disabled={loading || events.length === 0}
          className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium text-purple-300 bg-purple-500/10 border border-purple-500/30 rounded-lg hover:bg-purple-500/20 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <>
              <div className="w-3 h-3 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
              Analysing...
            </>
          ) : events.length === 0 ? (
            'Log meals first to get feedback'
          ) : (
            'Get AI Feedback'
          )}
        </button>
      ) : (
        <div className="space-y-2">
          {/* Rating header */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${ratingStyle?.dot}`} />
            <span className="text-xs font-medium text-heading">{ratingStyle?.label}</span>
            <button
              type="button"
              onClick={() => { setResult(null); setError(null); }}
              className="ml-auto text-[10px] text-dim hover:text-sub transition-colors"
            >
              Refresh
            </button>
          </div>

          {/* Summary */}
          <p className="text-xs text-sub leading-relaxed">{result.summary}</p>

          {/* Tips */}
          {result.tips.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] text-dim uppercase">Tips</p>
              {result.tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-sub">
                  <span className="text-accent flex-shrink-0 mt-0.5">-</span>
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="mt-2 text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
