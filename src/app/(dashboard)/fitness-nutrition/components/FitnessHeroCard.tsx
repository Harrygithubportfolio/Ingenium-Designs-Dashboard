import Link from 'next/link';
import TrainingIntentBadge from '@/components/fitness/TrainingIntentBadge';
import type { ScheduledWorkout } from '@/lib/fitness/types';

interface FitnessHeroCardProps {
  todayWorkout: ScheduledWorkout | null;
  loading: boolean;
}

export default function FitnessHeroCard({ todayWorkout, loading }: FitnessHeroCardProps) {
  const template = todayWorkout?.template;
  const exercises = template?.exercises ?? [];

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-card to-inner rounded-2xl border border-edge p-5 h-48 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (!todayWorkout || !template) {
    return (
      <div className="bg-gradient-to-br from-card to-inner rounded-2xl border border-edge p-5 flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-inner flex items-center justify-center">
          <svg className="w-6 h-6 text-dim" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-sm text-dim">No workout scheduled for today</p>
        <Link
          href="/fitness/schedule"
          className="px-4 py-2 text-xs font-medium text-accent border border-accent/30 rounded-lg hover:bg-accent/10 transition-colors"
        >
          Schedule a Workout
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-card to-inner rounded-2xl border border-edge p-5 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-heading">Today&apos;s Session</h2>
        <TrainingIntentBadge intent={template.training_intent} />
      </div>

      <h3 className="text-xl font-bold text-heading mb-1">{template.name}</h3>
      <p className="text-xs text-dim mb-3">{exercises.length} exercises</p>

      <div className="space-y-1.5 mb-4">
        {exercises.slice(0, 5).map((ex) => (
          <div key={ex.id} className="flex items-center justify-between py-1.5 px-3 bg-inner rounded-lg">
            <span className="text-sm text-sub">{ex.exercise_name}</span>
            <span className="text-xs text-dim">
              {ex.target_sets}&times;{ex.target_reps}
              {ex.target_load_kg ? ` @${ex.target_load_kg}kg` : ''}
            </span>
          </div>
        ))}
        {exercises.length > 5 && (
          <p className="text-xs text-dim text-center">+{exercises.length - 5} more</p>
        )}
      </div>

      <Link
        href="/gym-mode"
        className="mt-auto w-full py-3 bg-gradient-to-r from-accent to-accent-secondary text-white font-semibold rounded-xl text-center hover:opacity-90 transition-opacity"
      >
        Start Gym Mode
      </Link>
    </div>
  );
}
