'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type {
  ProgrammeQuestionnaire,
  ExperienceLevel,
  ProgrammeGoal,
  SessionDuration,
  EquipmentAccess,
} from '@/lib/fitness/programme-types';
import {
  EXPERIENCE_LEVEL_LABELS,
  PROGRAMME_GOAL_LABELS,
  EQUIPMENT_ACCESS_LABELS,
} from '@/lib/fitness/programme-types';

type Step = 1 | 2 | 3 | 4;

const STEP_TITLES: Record<Step, string> = {
  1: 'About You',
  2: 'Your Goals',
  3: 'Your Setup',
  4: 'Review & Generate',
};

export default function GenerateProgrammePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [age, setAge] = useState<number>(25);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('beginner');
  const [primaryGoal, setPrimaryGoal] = useState<ProgrammeGoal>('build_muscle');
  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [sessionDuration, setSessionDuration] = useState<SessionDuration>(60);
  const [equipmentAccess, setEquipmentAccess] = useState<EquipmentAccess>('full_gym');
  const [injuries, setInjuries] = useState('');
  const [bodyweight, setBodyweight] = useState<string>('');
  const [squatKg, setSquatKg] = useState<string>('');
  const [benchKg, setBenchKg] = useState<string>('');
  const [deadliftKg, setDeadliftKg] = useState<string>('');
  const [ohpKg, setOhpKg] = useState<string>('');

  const canProceed = (): boolean => {
    switch (step) {
      case 1: return age >= 14 && age <= 100;
      case 2: return daysPerWeek >= 2 && daysPerWeek <= 6;
      case 3: return true;
      case 4: return !generating;
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);

    const questionnaire: ProgrammeQuestionnaire = {
      age,
      experience_level: experienceLevel,
      primary_goal: primaryGoal,
      days_per_week: daysPerWeek,
      session_duration_min: sessionDuration,
      equipment_access: equipmentAccess,
      injuries_limitations: injuries,
      current_bodyweight_kg: bodyweight ? parseFloat(bodyweight) : undefined,
      current_lifts: {
        squat_kg: squatKg ? parseFloat(squatKg) : undefined,
        bench_kg: benchKg ? parseFloat(benchKg) : undefined,
        deadlift_kg: deadliftKg ? parseFloat(deadliftKg) : undefined,
        overhead_press_kg: ohpKg ? parseFloat(ohpKg) : undefined,
      },
    };

    try {
      const res = await fetch('/api/fitness/generate-programme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(questionnaire),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      router.push(`/fitness/programmes/${json.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate programme');
      setGenerating(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/fitness-nutrition" className="text-dim hover:text-sub transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-heading">Generate Programme</h1>
            <p className="text-dim text-[11px]">AI-powered bespoke training plan</p>
          </div>
        </div>
      </header>

      {/* Progress bar */}
      <div className="flex-shrink-0 flex items-center gap-2">
        {([1, 2, 3, 4] as Step[]).map((s) => (
          <div key={s} className="flex-1 flex flex-col gap-1">
            <div className={`h-1 rounded-full transition-colors ${s <= step ? 'bg-accent' : 'bg-inner'}`} />
            <span className={`text-[10px] ${s === step ? 'text-accent font-medium' : 'text-dim'}`}>
              {STEP_TITLES[s]}
            </span>
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="bg-gradient-to-br from-card to-inner rounded-2xl border border-edge p-6 max-w-2xl">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-heading mb-2">Age</label>
                <input
                  type="number"
                  min={14}
                  max={100}
                  value={age}
                  onChange={(e) => setAge(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-4 py-3 bg-inner border border-edge rounded-xl text-heading focus:border-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-heading mb-2">Experience Level</label>
                <div className="grid grid-cols-3 gap-3">
                  {(Object.keys(EXPERIENCE_LEVEL_LABELS) as ExperienceLevel[]).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setExperienceLevel(level)}
                      className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
                        experienceLevel === level
                          ? 'bg-accent/10 border-accent/50 text-accent'
                          : 'bg-inner border-edge text-sub hover:border-accent/30'
                      }`}
                    >
                      {EXPERIENCE_LEVEL_LABELS[level]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-heading mb-2">Primary Goal</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(Object.keys(PROGRAMME_GOAL_LABELS) as ProgrammeGoal[]).map((goal) => (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => setPrimaryGoal(goal)}
                      className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all text-left ${
                        primaryGoal === goal
                          ? 'bg-accent/10 border-accent/50 text-accent'
                          : 'bg-inner border-edge text-sub hover:border-accent/30'
                      }`}
                    >
                      {PROGRAMME_GOAL_LABELS[goal]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-heading mb-2">
                  Days per Week: <span className="text-accent">{daysPerWeek}</span>
                </label>
                <input
                  type="range"
                  min={2}
                  max={6}
                  value={daysPerWeek}
                  onChange={(e) => setDaysPerWeek(parseInt(e.target.value, 10))}
                  className="w-full accent-[#3b82f6]"
                />
                <div className="flex justify-between text-[10px] text-dim mt-1">
                  <span>2</span><span>3</span><span>4</span><span>5</span><span>6</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-heading mb-2">Session Duration</label>
                <div className="grid grid-cols-4 gap-3">
                  {([30, 45, 60, 90] as SessionDuration[]).map((dur) => (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => setSessionDuration(dur)}
                      className={`py-3 rounded-xl border text-sm font-medium transition-all ${
                        sessionDuration === dur
                          ? 'bg-accent/10 border-accent/50 text-accent'
                          : 'bg-inner border-edge text-sub hover:border-accent/30'
                      }`}
                    >
                      {dur} min
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-heading mb-2">Equipment Access</label>
                <div className="grid grid-cols-3 gap-3">
                  {(Object.keys(EQUIPMENT_ACCESS_LABELS) as EquipmentAccess[]).map((eq) => (
                    <button
                      key={eq}
                      type="button"
                      onClick={() => setEquipmentAccess(eq)}
                      className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
                        equipmentAccess === eq
                          ? 'bg-accent/10 border-accent/50 text-accent'
                          : 'bg-inner border-edge text-sub hover:border-accent/30'
                      }`}
                    >
                      {EQUIPMENT_ACCESS_LABELS[eq]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-heading mb-2">
                  Injuries or Limitations <span className="text-dim">(optional)</span>
                </label>
                <textarea
                  value={injuries}
                  onChange={(e) => setInjuries(e.target.value)}
                  placeholder="e.g. Lower back pain, knee injury..."
                  rows={3}
                  className="w-full px-4 py-3 bg-inner border border-edge rounded-xl text-heading placeholder:text-dim/50 focus:border-accent focus:outline-none resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-heading mb-2">
                  Current Stats <span className="text-dim">(optional)</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] text-dim uppercase mb-1 block">Bodyweight (kg)</label>
                    <input
                      type="number"
                      value={bodyweight}
                      onChange={(e) => setBodyweight(e.target.value)}
                      placeholder="80"
                      className="w-full px-3 py-2 bg-inner border border-edge rounded-lg text-heading text-sm focus:border-accent focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-dim uppercase mb-1 block">Squat (kg)</label>
                    <input
                      type="number"
                      value={squatKg}
                      onChange={(e) => setSquatKg(e.target.value)}
                      placeholder="100"
                      className="w-full px-3 py-2 bg-inner border border-edge rounded-lg text-heading text-sm focus:border-accent focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-dim uppercase mb-1 block">Bench (kg)</label>
                    <input
                      type="number"
                      value={benchKg}
                      onChange={(e) => setBenchKg(e.target.value)}
                      placeholder="60"
                      className="w-full px-3 py-2 bg-inner border border-edge rounded-lg text-heading text-sm focus:border-accent focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-dim uppercase mb-1 block">Deadlift (kg)</label>
                    <input
                      type="number"
                      value={deadliftKg}
                      onChange={(e) => setDeadliftKg(e.target.value)}
                      placeholder="120"
                      className="w-full px-3 py-2 bg-inner border border-edge rounded-lg text-heading text-sm focus:border-accent focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-dim uppercase mb-1 block">OHP (kg)</label>
                    <input
                      type="number"
                      value={ohpKg}
                      onChange={(e) => setOhpKg(e.target.value)}
                      placeholder="40"
                      className="w-full px-3 py-2 bg-inner border border-edge rounded-lg text-heading text-sm focus:border-accent focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              {generating ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <div className="w-12 h-12 border-3 border-accent/30 border-t-accent rounded-full animate-spin" />
                  <p className="text-heading font-medium">Generating your bespoke programme...</p>
                  <p className="text-dim text-sm">This may take up to 30 seconds</p>
                </div>
              ) : (
                <>
                  <h3 className="text-sm font-semibold text-heading">Review Your Details</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <ReviewItem label="Age" value={String(age)} />
                    <ReviewItem label="Experience" value={EXPERIENCE_LEVEL_LABELS[experienceLevel]} />
                    <ReviewItem label="Goal" value={PROGRAMME_GOAL_LABELS[primaryGoal]} />
                    <ReviewItem label="Days / Week" value={String(daysPerWeek)} />
                    <ReviewItem label="Session Duration" value={`${sessionDuration} min`} />
                    <ReviewItem label="Equipment" value={EQUIPMENT_ACCESS_LABELS[equipmentAccess]} />
                    {injuries && <ReviewItem label="Injuries" value={injuries} />}
                    {bodyweight && <ReviewItem label="Bodyweight" value={`${bodyweight} kg`} />}
                  </div>

                  {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                      {error}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleGenerate}
                    className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity text-lg"
                  >
                    Generate Bespoke Programme
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      {!generating && (
        <div className="flex-shrink-0 flex items-center justify-between">
          <button
            type="button"
            onClick={() => step > 1 && setStep((step - 1) as Step)}
            disabled={step === 1}
            className="px-4 py-2 text-sm font-medium text-sub hover:text-heading disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Back
          </button>
          {step < 4 && (
            <button
              type="button"
              onClick={() => canProceed() && setStep((step + 1) as Step)}
              disabled={!canProceed()}
              className="px-6 py-2 bg-gradient-to-r from-accent to-accent-secondary text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              Continue
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-inner rounded-xl p-3">
      <p className="text-[10px] text-dim uppercase">{label}</p>
      <p className="text-sm text-heading font-medium">{value}</p>
    </div>
  );
}
