'use client';

import { useState, useEffect } from 'react';
import {
  Reflection,
  DailyFocus,
  getDailyEveningPrompt,
  generateId,
  getTodayString,
} from '../utils/focusTypes';

interface EveningReviewProps {
  reflection: Reflection | null;
  focus: DailyFocus | null;
  onReflectionChange: (reflection: Reflection) => void;
}

export default function EveningReview({ reflection, focus, onReflectionChange }: EveningReviewProps) {
  const [isEditing, setIsEditing] = useState(!reflection);
  const [wentWell, setWentWell] = useState(reflection?.wentWell || '');
  const [challenges, setChallenges] = useState(reflection?.challenges || '');
  const [improvements, setImprovements] = useState(reflection?.improvements || '');
  const [gratitude, setGratitude] = useState(reflection?.gratitude || '');

  const eveningPrompt = getDailyEveningPrompt();

  // Calculate today's completion stats
  const totalTasks = focus ? focus.supportingTasks.length + 1 : 0;
  const completedTasks = focus
    ? focus.supportingTasks.filter(t => t.completed).length + (focus.primaryFocusCompleted ? 1 : 0)
    : 0;

  // Sync with reflection prop
  useEffect(() => {
    if (reflection) {
      setWentWell(reflection.wentWell);
      setChallenges(reflection.challenges);
      setImprovements(reflection.improvements);
      setGratitude(reflection.gratitude || '');
      setIsEditing(false);
    }
  }, [reflection]);

  const handleSave = () => {
    if (!wentWell.trim() && !challenges.trim() && !improvements.trim()) return;

    const newReflection: Reflection = {
      id: reflection?.id || generateId(),
      date: getTodayString(),
      wentWell: wentWell.trim(),
      challenges: challenges.trim(),
      improvements: improvements.trim(),
      gratitude: gratitude.trim() || undefined,
      createdAt: reflection?.createdAt || new Date().toISOString(),
    };

    onReflectionChange(newReflection);
    setIsEditing(false);
  };

  // Editing mode
  if (isEditing) {
    return (
      <div className="h-full bg-gradient-to-br from-[#1a1a22] to-[#14141a] rounded-2xl border border-[#2a2a33] p-5 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5 flex-shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Evening Review</h2>
            <p className="text-xs text-gray-500">Reflect on your day</p>
          </div>
        </div>

        {/* Today's Summary */}
        {focus && (
          <div className="flex-shrink-0 p-3 bg-[#14141a] rounded-xl border border-[#2a2a33] mb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500 uppercase">Today&apos;s Progress</p>
              <p className="text-sm font-medium text-[#3b82f6]">{completedTasks}/{totalTasks} tasks</p>
            </div>
            <div className="h-1.5 bg-[#22222c] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] rounded-full transition-all"
                style={{ width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%` }}
              />
            </div>
            {focus.primaryFocusCompleted && (
              <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Primary focus completed!
              </p>
            )}
          </div>
        )}

        {/* Form content */}
        <div className="flex-1 min-h-0 overflow-y-auto space-y-4">
          {/* What went well */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <span className="text-green-400 mr-1">✓</span> What went well today?
            </label>
            <textarea
              value={wentWell}
              onChange={(e) => setWentWell(e.target.value)}
              placeholder="Celebrate your wins, big or small..."
              rows={2}
              className="w-full px-4 py-3 bg-[#14141a] border border-[#2a2a33] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 transition-colors resize-none"
            />
          </div>

          {/* Challenges */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <span className="text-amber-400 mr-1">!</span> What challenged me?
            </label>
            <textarea
              value={challenges}
              onChange={(e) => setChallenges(e.target.value)}
              placeholder="Acknowledge difficulties without judgment..."
              rows={2}
              className="w-full px-4 py-3 bg-[#14141a] border border-[#2a2a33] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 transition-colors resize-none"
            />
          </div>

          {/* Improvements */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <span className="text-[#3b82f6] mr-1">↑</span> What will I improve tomorrow?
            </label>
            <textarea
              value={improvements}
              onChange={(e) => setImprovements(e.target.value)}
              placeholder="One small improvement to carry forward..."
              rows={2}
              className="w-full px-4 py-3 bg-[#14141a] border border-[#2a2a33] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#3b82f6]/50 transition-colors resize-none"
            />
          </div>

          {/* Gratitude */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <span className="text-purple-400 mr-1">♡</span> {eveningPrompt}
            </label>
            <textarea
              value={gratitude}
              onChange={(e) => setGratitude(e.target.value)}
              placeholder="What brought you joy or gratitude today?"
              rows={2}
              className="w-full px-4 py-3 bg-[#14141a] border border-[#2a2a33] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-colors resize-none"
            />
          </div>
        </div>

        {/* Save button */}
        <div className="flex-shrink-0 pt-4 border-t border-[#2a2a33] mt-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={!wentWell.trim() && !challenges.trim() && !improvements.trim()}
            className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl text-white font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Complete Evening Review
          </button>
        </div>
      </div>
    );
  }

  // Display mode
  return (
    <div className="h-full bg-gradient-to-br from-[#1a1a22] to-[#14141a] rounded-2xl border border-[#2a2a33] p-5 flex flex-col overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Evening Review</h2>
            <p className="text-xs text-gray-500">Today&apos;s reflections</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="p-2 text-gray-400 hover:text-white hover:bg-[#22222c] rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-4">
        {/* Completed badge */}
        <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
          <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm text-green-400 font-medium">Evening review complete</span>
        </div>

        {/* What went well */}
        {reflection?.wentWell && (
          <div className="p-3 bg-[#14141a] rounded-lg border border-[#2a2a33]">
            <p className="text-xs text-green-400 font-medium mb-1 flex items-center gap-1">
              <span>✓</span> What went well
            </p>
            <p className="text-sm text-gray-300">{reflection.wentWell}</p>
          </div>
        )}

        {/* Challenges */}
        {reflection?.challenges && (
          <div className="p-3 bg-[#14141a] rounded-lg border border-[#2a2a33]">
            <p className="text-xs text-amber-400 font-medium mb-1 flex items-center gap-1">
              <span>!</span> Challenges
            </p>
            <p className="text-sm text-gray-300">{reflection.challenges}</p>
          </div>
        )}

        {/* Improvements */}
        {reflection?.improvements && (
          <div className="p-3 bg-[#14141a] rounded-lg border border-[#2a2a33]">
            <p className="text-xs text-[#3b82f6] font-medium mb-1 flex items-center gap-1">
              <span>↑</span> Tomorrow&apos;s focus
            </p>
            <p className="text-sm text-gray-300">{reflection.improvements}</p>
          </div>
        )}

        {/* Gratitude */}
        {reflection?.gratitude && (
          <div className="p-3 bg-[#14141a] rounded-lg border border-[#2a2a33]">
            <p className="text-xs text-purple-400 font-medium mb-1 flex items-center gap-1">
              <span>♡</span> Gratitude
            </p>
            <p className="text-sm text-gray-300 italic">&ldquo;{reflection.gratitude}&rdquo;</p>
          </div>
        )}
      </div>
    </div>
  );
}
