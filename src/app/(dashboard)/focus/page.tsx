'use client';

import { useState, useEffect, useCallback } from 'react';
import FocusHeader from './components/FocusHeader';
import MorningFocus from './components/MorningFocus';
import EveningReview from './components/EveningReview';
import DailyProgress from './components/DailyProgress';
import QuoteCard from './components/QuoteCard';
import {
  DailyFocus,
  Reflection,
  isMorningMode,
  isEveningMode,
  getTodaysFocus,
  getTodaysReflection,
  saveDailyFocus,
  saveReflection,
} from './utils/focusTypes';

export default function FocusPage() {
  const [focus, setFocus] = useState<DailyFocus | null>(null);
  const [reflection, setReflection] = useState<Reflection | null>(null);
  const [activeTab, setActiveTab] = useState<'morning' | 'evening'>('morning');
  const [mounted, setMounted] = useState(false);

  // Determine which mode to show based on time
  useEffect(() => {
    setMounted(true);
    const morning = isMorningMode();
    const evening = isEveningMode();

    // Default to morning mode unless it's evening
    if (evening && !morning) {
      setActiveTab('evening');
    } else {
      setActiveTab('morning');
    }
  }, []);

  // Load saved data
  useEffect(() => {
    if (!mounted) return;
    const savedFocus = getTodaysFocus();
    const savedReflection = getTodaysReflection();
    if (savedFocus) setFocus(savedFocus);
    if (savedReflection) setReflection(savedReflection);
  }, [mounted]);

  // Handle focus change
  const handleFocusChange = useCallback((newFocus: DailyFocus) => {
    setFocus(newFocus);
    saveDailyFocus(newFocus);
  }, []);

  // Handle reflection change
  const handleReflectionChange = useCallback((newReflection: Reflection) => {
    setReflection(newReflection);
    saveReflection(newReflection);
  }, []);

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#3b82f6]/30 border-t-[#3b82f6] rounded-full animate-spin" />
      </div>
    );
  }

  const showMorning = isMorningMode();
  const showEvening = isEveningMode();

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header with greeting and weather */}
      <FocusHeader />

      {/* Tab switcher - only show when both modes are available or user wants to switch */}
      <div className="flex-shrink-0 flex items-center gap-2 mb-4">
        <button
          type="button"
          onClick={() => setActiveTab('morning')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'morning'
              ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30'
              : 'bg-[#1a1a22] text-gray-400 border border-[#2a2a33] hover:border-[#3a3a44]'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          Morning Focus
          {showMorning && !focus && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('evening')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'evening'
              ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-purple-400 border border-purple-500/30'
              : 'bg-[#1a1a22] text-gray-400 border border-[#2a2a33] hover:border-[#3a3a44]'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
          Evening Review
          {showEvening && !reflection && focus && (
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
          )}
        </button>

        <div className="flex-1" />

        {/* Quick stats */}
        {focus && (
          <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-[#1a1a22] rounded-lg border border-[#2a2a33]">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Tasks</span>
              <span className="text-sm font-bold text-white">
                {focus.supportingTasks.filter(t => t.completed).length + (focus.primaryFocusCompleted ? 1 : 0)}
                /
                {focus.supportingTasks.length + 1}
              </span>
            </div>
            {focus.primaryFocusCompleted && (
              <>
                <div className="w-px h-4 bg-[#2a2a33]" />
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
          ) : (
            <EveningReview
              reflection={reflection}
              focus={focus}
              onReflectionChange={handleReflectionChange}
            />
          )}
        </div>

        {/* Right sidebar - 1 column on desktop */}
        <div className="hidden lg:flex flex-col gap-4 min-h-0 overflow-hidden">
          {/* Daily Progress */}
          <div className="flex-1 min-h-0">
            <DailyProgress focus={focus} />
          </div>

          {/* Quote */}
          <div className="flex-shrink-0">
            <QuoteCard variant="compact" />
          </div>
        </div>

        {/* Mobile: show progress and quote below */}
        <div className="lg:hidden grid grid-cols-2 gap-4">
          <DailyProgress focus={focus} />
          <QuoteCard />
        </div>
      </div>
    </div>
  );
}
