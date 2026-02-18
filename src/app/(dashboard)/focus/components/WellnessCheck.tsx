'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

// ============================================
// Mood Check-in
// ============================================

const moodLevels = [
  { score: 1, label: 'Very Low', icon: '😔', colour: 'text-red-400 bg-red-500/10 border-red-500/30' },
  { score: 2, label: 'Low', icon: '😐', colour: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  { score: 3, label: 'Okay', icon: '🙂', colour: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' },
  { score: 4, label: 'Good', icon: '😊', colour: 'text-green-400 bg-green-500/10 border-green-500/30' },
  { score: 5, label: 'Excellent', icon: '😄', colour: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
];

// ============================================
// Stretch Suggestions
// ============================================

const stretchSuggestions = [
  { name: 'Neck Rolls', instruction: 'Gently roll your head in slow circles — 5 times each direction.', duration: 30 },
  { name: 'Shoulder Shrugs', instruction: 'Raise both shoulders to your ears, hold for 5 seconds, then release. Repeat 5 times.', duration: 25 },
  { name: 'Chest Opener', instruction: 'Clasp your hands behind your back, straighten your arms, and lift them slightly while opening your chest.', duration: 20 },
  { name: 'Seated Spinal Twist', instruction: 'Sit tall, place your right hand on your left knee, twist gently to the left. Hold, then switch sides.', duration: 30 },
  { name: 'Wrist Circles', instruction: 'Extend your arms and rotate your wrists in circles — 10 times each direction.', duration: 20 },
  { name: 'Standing Forward Fold', instruction: 'Stand and slowly fold forward from the hips, letting your arms hang. Hold for 20 seconds.', duration: 20 },
  { name: 'Hip Flexor Stretch', instruction: 'Step one foot forward into a lunge. Push your hips forward gently. Hold 15 seconds each side.', duration: 30 },
  { name: 'Calf Raises', instruction: 'Stand and rise onto your toes, hold for 2 seconds, lower back down. Repeat 10 times.', duration: 25 },
  { name: 'Side Stretch', instruction: 'Raise one arm overhead and lean to the opposite side. Hold 15 seconds, then switch.', duration: 30 },
  { name: 'Eye Palming', instruction: 'Rub your palms together to warm them, then gently cup them over your closed eyes for 20 seconds.', duration: 20 },
];

// ============================================
// Body Scan Steps
// ============================================

const bodyScanSteps = [
  'Close your eyes and take three deep breaths. Let your body settle.',
  'Bring your attention to the top of your head. Notice any sensation — warmth, tingling, or tension. Let it soften.',
  'Move your awareness to your face — forehead, jaw, eyes. Notice if you\'re holding any tension. Release it with an exhale.',
  'Shift your focus to your shoulders and neck. Let any tightness melt away as you breathe.',
  'Scan down through your arms to your fingertips. Notice the weight of your hands resting.',
  'Bring awareness to your chest and belly. Feel the gentle rise and fall of your breath.',
  'Notice your lower back, hips, and legs. Let them feel heavy and supported.',
  'Finally, take three slow breaths. Open your eyes gently when you\'re ready.',
];

// ============================================
// Component
// ============================================

type CheckView = 'list' | 'mood' | 'stretch' | 'bodyscan';

export default function WellnessCheck() {
  const [view, setView] = useState<CheckView>('list');
  const [todayMood, setTodayMood] = useState<number | null>(null);
  const [moodSaving, setMoodSaving] = useState(false);

  // Stretch state
  const [currentStretch, setCurrentStretch] = useState(() =>
    stretchSuggestions[Math.floor(Math.random() * stretchSuggestions.length)]
  );
  const [stretchTimer, setStretchTimer] = useState(0);
  const [stretchActive, setStretchActive] = useState(false);
  const stretchIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Body scan state
  const [scanStep, setScanStep] = useState(0);

  // Load today's mood on mount
  useEffect(() => {
    const loadMood = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('wellness_checks')
        .select('mood_score')
        .eq('check_type', 'mood')
        .eq('check_date', today)
        .maybeSingle();

      if (data?.mood_score) setTodayMood(data.mood_score);
    };
    loadMood();
  }, []);

  // Stretch timer
  useEffect(() => {
    if (!stretchActive) {
      if (stretchIntervalRef.current) clearInterval(stretchIntervalRef.current);
      return;
    }

    stretchIntervalRef.current = setInterval(() => {
      setStretchTimer(prev => {
        if (prev <= 1) {
          setStretchActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (stretchIntervalRef.current) clearInterval(stretchIntervalRef.current);
    };
  }, [stretchActive]);

  const saveMood = async (score: number) => {
    setMoodSaving(true);
    setTodayMood(score);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setMoodSaving(false); return; }

    await supabase.from('wellness_checks').upsert(
      {
        user_id: user.id,
        check_date: new Date().toISOString().split('T')[0],
        check_type: 'mood',
        mood_score: score,
      },
      { onConflict: 'user_id,check_date,check_type' }
    );

    setMoodSaving(false);
  };

  const startStretch = () => {
    const stretch = stretchSuggestions[Math.floor(Math.random() * stretchSuggestions.length)];
    setCurrentStretch(stretch);
    setStretchTimer(stretch.duration);
    setStretchActive(true);
  };

  // ========= LIST VIEW =========
  if (view === 'list') {
    return (
      <div className="bg-gradient-to-br from-card to-inner rounded-2xl border border-edge p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
            <svg className="w-5 h-5 text-heading" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-heading">Wellness Checks</h3>
            <p className="text-xs text-dim">Quick check-ins for your well-being</p>
          </div>
        </div>

        <div className="space-y-2">
          {/* Mood check-in */}
          <button
            type="button"
            onClick={() => setView('mood')}
            className="w-full flex items-center gap-3 p-3 bg-inner border border-edge rounded-xl hover:border-pink-500/20 transition-all text-left group"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
              <span className="text-base">😊</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-heading">Mood Check-in</p>
              <p className="text-[10px] text-dim">How are you feeling right now?</p>
            </div>
            {todayMood && (
              <span className="text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
                Logged
              </span>
            )}
            <svg className="w-4 h-4 text-dim group-hover:text-sub transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Stretch break */}
          <button
            type="button"
            onClick={() => setView('stretch')}
            className="w-full flex items-center gap-3 p-3 bg-inner border border-edge rounded-xl hover:border-pink-500/20 transition-all text-left group"
          >
            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
              <span className="text-base">🧘</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-heading">Stretch Break</p>
              <p className="text-[10px] text-dim">Quick guided stretch to loosen up</p>
            </div>
            <svg className="w-4 h-4 text-dim group-hover:text-sub transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Body scan */}
          <button
            type="button"
            onClick={() => setView('bodyscan')}
            className="w-full flex items-center gap-3 p-3 bg-inner border border-edge rounded-xl hover:border-pink-500/20 transition-all text-left group"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
              <span className="text-base">🫧</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-heading">Body Scan</p>
              <p className="text-[10px] text-dim">1-2 min guided awareness exercise</p>
            </div>
            <svg className="w-4 h-4 text-dim group-hover:text-sub transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  // ========= MOOD VIEW =========
  if (view === 'mood') {
    return (
      <div className="bg-gradient-to-br from-card to-inner rounded-2xl border border-edge p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-heading">Mood Check-in</h3>
          <button type="button" onClick={() => setView('list')} className="text-xs text-accent hover:text-heading transition-colors">
            Back
          </button>
        </div>

        <p className="text-sm text-sub mb-4">How are you feeling right now?</p>

        <div className="flex items-center justify-center gap-3 mb-4">
          {moodLevels.map((mood) => (
            <button
              key={mood.score}
              type="button"
              onClick={() => saveMood(mood.score)}
              disabled={moodSaving}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${
                todayMood === mood.score
                  ? mood.colour
                  : 'bg-inner border-edge hover:border-accent/20'
              }`}
            >
              <span className="text-2xl">{mood.icon}</span>
              <span className="text-[10px] text-dim">{mood.label}</span>
            </button>
          ))}
        </div>

        {todayMood && (
          <div className="text-center">
            <p className="text-xs text-green-400">Mood logged for today</p>
          </div>
        )}
      </div>
    );
  }

  // ========= STRETCH VIEW =========
  if (view === 'stretch') {
    return (
      <div className="bg-gradient-to-br from-card to-inner rounded-2xl border border-edge p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-heading">Stretch Break</h3>
          <button type="button" onClick={() => { setView('list'); setStretchActive(false); }} className="text-xs text-accent hover:text-heading transition-colors">
            Back
          </button>
        </div>

        <div className="bg-inner border border-edge rounded-xl p-4 mb-4">
          <p className="text-sm font-medium text-heading mb-1">{currentStretch.name}</p>
          <p className="text-xs text-sub leading-relaxed">{currentStretch.instruction}</p>
        </div>

        {stretchActive ? (
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
              <span className="text-2xl font-bold text-green-400">{stretchTimer}</span>
            </div>
            <p className="text-xs text-dim">seconds remaining</p>
          </div>
        ) : stretchTimer === 0 && currentStretch ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={startStretch}
              className="flex-1 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Start Timer ({currentStretch.duration}s)
            </button>
            <button
              type="button"
              onClick={() => {
                const stretch = stretchSuggestions[Math.floor(Math.random() * stretchSuggestions.length)];
                setCurrentStretch(stretch);
              }}
              className="px-4 py-2.5 bg-elevated border border-edge rounded-xl text-sub text-sm font-medium hover:border-green-500/30 transition-all"
            >
              Another
            </button>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm text-green-400 font-medium mb-3">Nice stretch!</p>
            <button
              type="button"
              onClick={startStretch}
              className="px-4 py-2 bg-elevated border border-edge rounded-lg text-sm text-sub hover:border-green-500/30 transition-all"
            >
              Another stretch
            </button>
          </div>
        )}
      </div>
    );
  }

  // ========= BODY SCAN VIEW =========
  return (
    <div className="bg-gradient-to-br from-card to-inner rounded-2xl border border-edge p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-heading">Body Scan</h3>
        <button type="button" onClick={() => { setView('list'); setScanStep(0); }} className="text-xs text-accent hover:text-heading transition-colors">
          Back
        </button>
      </div>

      <div className="mb-4">
        {/* Progress dots */}
        <div className="flex items-center gap-1.5 mb-4">
          {bodyScanSteps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all ${
                i <= scanStep ? 'bg-purple-500' : 'bg-elevated'
              }`}
            />
          ))}
        </div>

        {/* Current step */}
        <div className="bg-inner border border-edge rounded-xl p-4 min-h-[80px] flex items-center">
          <p className="text-sm text-sub leading-relaxed">{bodyScanSteps[scanStep]}</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setScanStep(Math.max(0, scanStep - 1))}
          disabled={scanStep === 0}
          className="px-4 py-2 bg-elevated border border-edge rounded-lg text-sm text-sub disabled:opacity-30 hover:border-purple-500/30 transition-all"
        >
          Previous
        </button>
        <span className="text-xs text-dim">{scanStep + 1} / {bodyScanSteps.length}</span>
        {scanStep < bodyScanSteps.length - 1 ? (
          <button
            type="button"
            onClick={() => setScanStep(scanStep + 1)}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg text-sm text-white font-medium hover:opacity-90 transition-opacity"
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            onClick={() => { setView('list'); setScanStep(0); }}
            className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg text-sm text-white font-medium hover:opacity-90 transition-opacity"
          >
            Done
          </button>
        )}
      </div>
    </div>
  );
}
