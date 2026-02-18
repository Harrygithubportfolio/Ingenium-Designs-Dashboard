'use client';

import { useState, useEffect, useCallback } from 'react';
import FocusHeader from './components/FocusHeader';
import MorningFocus from './components/MorningFocus';
import EveningReview from './components/EveningReview';
import PomodoroTimer from './components/PomodoroTimer';
import DailyProgress from './components/DailyProgress';
import MindfulnessTab from './components/MindfulnessTab';
import TipsWidget from './components/TipsWidget';
import WellnessQuickActions from './components/WellnessQuickActions';
import { useDailyFocus } from '@/store/useDailyFocus';
import type { DailyFocus, Reflection } from '@/lib/focus/types';
import {
  isMorningMode,
  isEveningMode,
} from './utils/focusTypes';

type FocusTab = 'morning' | 'evening' | 'pomodoro' | 'mindfulness';

export default function FocusPage() {
  const { focus, reflection, loading, fetchToday, saveFocus, updateFocus, saveReflection } = useDailyFocus();
  const [activeTab, setActiveTab] = useState<FocusTab>('morning');
  const [mounted, setMounted] = useState(false);

  // Determine which mode to show based on time
  useEffect(() => {
    setMounted(true);
    const morning = isMorningMode();
    const evening = isEveningMode();

    if (evening && !morning) {
      setActiveTab('evening');
    } else {
      setActiveTab('morning');
    }
  }, []);

  // Fetch today's data from Supabase
  useEffect(() => {
    if (!mounted) return;
    fetchToday();
  }, [mounted, fetchToday]);

  // Bridge callback for MorningFocus — translates DailyFocus object to store actions
  const handleFocusChange = useCallback((newFocus: DailyFocus) => {
    if (focus) {
      updateFocus({
        primaryFocus: newFocus.primaryFocus,
        primaryFocusCompleted: newFocus.primaryFocusCompleted,
        supportingTasks: newFocus.supportingTasks,
        intentionNote: newFocus.intentionNote,
      });
    } else {
      saveFocus({
        primaryFocus: newFocus.primaryFocus,
        supportingTasks: newFocus.supportingTasks,
        intentionNote: newFocus.intentionNote,
      });
    }
  }, [focus, updateFocus, saveFocus]);

  // Bridge callback for EveningReview
  const handleReflectionChange = useCallback((newReflection: Reflection) => {
    saveReflection({
      wentWell: newReflection.wentWell,
      challenges: newReflection.challenges,
      improvements: newReflection.improvements,
      gratitude: newReflection.gratitude,
    });
  }, [saveReflection]);

  // Prevent hydration mismatch
  if (!mounted || loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  const showMorning = isMorningMode();
  const showEvening = isEveningMode();

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header with greeting and weather */}
      <FocusHeader />

      {/* Tab switcher */}
      <div className="flex-shrink-0 flex items-center gap-2 mb-4 overflow-x-auto scrollbar-hide">
        <button
          type="button"
          onClick={() => setActiveTab('morning')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all flex-shrink-0 ${
            activeTab === 'morning'
              ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30'
              : 'bg-card text-sub border border-edge hover:border-edge'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span className="hidden sm:inline">Morning Focus</span>
          <span className="sm:hidden">Morning</span>
          {showMorning && !focus && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('evening')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all flex-shrink-0 ${
            activeTab === 'evening'
              ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-purple-400 border border-purple-500/30'
              : 'bg-card text-sub border border-edge hover:border-edge'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
          <span className="hidden sm:inline">Evening Review</span>
          <span className="sm:hidden">Evening</span>
          {showEvening && !reflection && focus && (
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pomodoro')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all flex-shrink-0 ${
            activeTab === 'pomodoro'
              ? 'bg-gradient-to-r from-red-500/20 to-orange-500/20 text-red-400 border border-red-500/30'
              : 'bg-card text-sub border border-edge hover:border-edge'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Pomodoro
        </button>

        <button
          type="button"
          data-tab="mindfulness"
          onClick={() => setActiveTab('mindfulness')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all flex-shrink-0 ${
            activeTab === 'mindfulness'
              ? 'bg-gradient-to-r from-teal-500/20 to-emerald-500/20 text-teal-400 border border-teal-500/30'
              : 'bg-card text-sub border border-edge hover:border-edge'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span className="hidden sm:inline">Mindfulness</span>
          <span className="sm:hidden">Mindful</span>
        </button>

        <div className="flex-1" />

        {/* Quick stats */}
        {focus && (
          <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-card rounded-lg border border-edge flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs text-dim">Tasks</span>
              <span className="text-sm font-bold text-heading">
                {focus.supportingTasks.filter(t => t.completed).length + (focus.primaryFocusCompleted ? 1 : 0)}
                /
                {focus.supportingTasks.length + 1}
              </span>
            </div>
            {focus.primaryFocusCompleted && (
              <>
                <div className="w-px h-4 bg-edge" />
                <div className="flex items-center gap-1 text-green-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-xs font-medium">Focus done</span>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Main content grid */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-4 overflow-hidden">
        {/* Main focus/review panel - 2 columns on desktop */}
        <div className="lg:col-span-2 min-h-0 overflow-hidden">
          {activeTab === 'morning' ? (
            <MorningFocus focus={focus} onFocusChange={handleFocusChange} />
          ) : activeTab === 'evening' ? (
            <EveningReview
              reflection={reflection}
              focus={focus}
              onReflectionChange={handleReflectionChange}
            />
          ) : activeTab === 'pomodoro' ? (
            <div className="h-full overflow-y-auto">
              <div className="bg-gradient-to-br from-card to-inner rounded-2xl border border-edge p-6">
                <PomodoroTimer />
              </div>
            </div>
          ) : (
            <MindfulnessTab />
          )}
        </div>

        {/* Right sidebar - 1 column on desktop */}
        <div className="hidden lg:flex flex-col gap-4 min-h-0 overflow-hidden">
          {/* Daily Progress */}
          <div className="flex-shrink-0">
            <DailyProgress focus={focus} />
          </div>

          {/* Wellness Quick Actions */}
          <div className="flex-shrink-0">
            <WellnessQuickActions />
          </div>

          {/* Tips Widget */}
          <div className="flex-1 min-h-0">
            <TipsWidget />
          </div>
        </div>

        {/* Mobile: show sidebar widgets below */}
        <div className="lg:hidden grid grid-cols-1 gap-4">
          <DailyProgress focus={focus} />
          <WellnessQuickActions />
          <TipsWidget />
        </div>
      </div>
    </div>
  );
}
