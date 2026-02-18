'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

const moodLevels = [
  { score: 1, icon: '😔' },
  { score: 2, icon: '😐' },
  { score: 3, icon: '🙂' },
  { score: 4, icon: '😊' },
  { score: 5, icon: '😄' },
];

export default function WellnessQuickActions() {
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [todayMood, setTodayMood] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // Load today's mood
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

  const saveMood = async (score: number) => {
    setSaving(true);
    setTodayMood(score);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    await supabase.from('wellness_checks').upsert(
      {
        user_id: user.id,
        check_date: new Date().toISOString().split('T')[0],
        check_type: 'mood',
        mood_score: score,
      },
      { onConflict: 'user_id,check_date,check_type' }
    );

    setSaving(false);
    setShowMoodPicker(false);
  };

  return (
    <div className="bg-gradient-to-br from-card to-inner rounded-2xl border border-edge p-4">
      <p className="text-xs font-semibold text-heading mb-3">Quick Wellness</p>

      {showMoodPicker ? (
        <div>
          <p className="text-[10px] text-dim mb-2">How are you feeling?</p>
          <div className="flex items-center justify-between gap-1">
            {moodLevels.map((mood) => (
              <button
                key={mood.score}
                type="button"
                onClick={() => saveMood(mood.score)}
                disabled={saving}
                className={`flex-1 py-2 rounded-lg text-center transition-all ${
                  todayMood === mood.score
                    ? 'bg-accent/20 border border-accent/30'
                    : 'bg-inner border border-edge hover:border-accent/20'
                }`}
              >
                <span className="text-lg">{mood.icon}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setShowMoodPicker(false)}
            className="mt-2 text-[10px] text-dim hover:text-sub transition-colors"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowMoodPicker(true)}
            className="flex-1 flex flex-col items-center gap-1 p-2.5 bg-inner border border-edge rounded-xl hover:border-accent/20 transition-all"
          >
            <span className="text-lg">{todayMood ? moodLevels[todayMood - 1].icon : '😊'}</span>
            <span className="text-[10px] text-dim">
              {todayMood ? 'Update Mood' : 'Log Mood'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              // Scroll to mindfulness tab hints — for now just provide a visual reminder
              const el = document.querySelector('[data-tab="mindfulness"]');
              if (el instanceof HTMLElement) el.click();
            }}
            className="flex-1 flex flex-col items-center gap-1 p-2.5 bg-inner border border-edge rounded-xl hover:border-accent/20 transition-all"
          >
            <span className="text-lg">🧘</span>
            <span className="text-[10px] text-dim">Stretch</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const el = document.querySelector('[data-tab="mindfulness"]');
              if (el instanceof HTMLElement) el.click();
            }}
            className="flex-1 flex flex-col items-center gap-1 p-2.5 bg-inner border border-edge rounded-xl hover:border-accent/20 transition-all"
          >
            <span className="text-lg">🌬️</span>
            <span className="text-[10px] text-dim">Breathe</span>
          </button>
        </div>
      )}
    </div>
  );
}
