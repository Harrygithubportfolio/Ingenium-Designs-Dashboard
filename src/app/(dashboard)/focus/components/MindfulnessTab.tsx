'use client';

import { useState } from 'react';
import BreathingExercise from './BreathingExercise';
import MeditationTimer from './MeditationTimer';
import WellnessCheck from './WellnessCheck';

type Section = 'breathing' | 'meditation' | 'wellness';

const sections: { id: Section; label: string; icon: string }[] = [
  { id: 'breathing', label: 'Breathing', icon: '🌬️' },
  { id: 'meditation', label: 'Meditation', icon: '🧘' },
  { id: 'wellness', label: 'Wellness', icon: '💚' },
];

export default function MindfulnessTab() {
  const [expanded, setExpanded] = useState<Section | null>('breathing');

  const toggleSection = (section: Section) => {
    setExpanded(prev => prev === section ? null : section);
  };

  return (
    <div className="h-full overflow-y-auto space-y-3 pr-1">
      {/* Quick nav pills */}
      <div className="flex items-center gap-2 mb-1">
        {sections.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => { setExpanded(s.id); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              expanded === s.id
                ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                : 'bg-card text-sub border border-edge hover:border-teal-500/20'
            }`}
          >
            <span className="text-sm">{s.icon}</span>
            {s.label}
          </button>
        ))}
      </div>

      {/* Breathing Exercises */}
      <div>
        <button
          type="button"
          onClick={() => toggleSection('breathing')}
          className="w-full flex items-center justify-between p-3 bg-card border border-edge rounded-xl hover:border-teal-500/20 transition-all mb-2"
        >
          <div className="flex items-center gap-2">
            <span className="text-base">🌬️</span>
            <span className="text-sm font-medium text-heading">Breathing Exercises</span>
          </div>
          <svg
            className={`w-4 h-4 text-dim transition-transform ${expanded === 'breathing' ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {expanded === 'breathing' && <BreathingExercise />}
      </div>

      {/* Meditation Timer */}
      <div>
        <button
          type="button"
          onClick={() => toggleSection('meditation')}
          className="w-full flex items-center justify-between p-3 bg-card border border-edge rounded-xl hover:border-teal-500/20 transition-all mb-2"
        >
          <div className="flex items-center gap-2">
            <span className="text-base">🧘</span>
            <span className="text-sm font-medium text-heading">Meditation Timer</span>
          </div>
          <svg
            className={`w-4 h-4 text-dim transition-transform ${expanded === 'meditation' ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {expanded === 'meditation' && <MeditationTimer />}
      </div>

      {/* Wellness Checks */}
      <div>
        <button
          type="button"
          onClick={() => toggleSection('wellness')}
          className="w-full flex items-center justify-between p-3 bg-card border border-edge rounded-xl hover:border-teal-500/20 transition-all mb-2"
        >
          <div className="flex items-center gap-2">
            <span className="text-base">💚</span>
            <span className="text-sm font-medium text-heading">Wellness Checks</span>
          </div>
          <svg
            className={`w-4 h-4 text-dim transition-transform ${expanded === 'wellness' ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {expanded === 'wellness' && <WellnessCheck />}
      </div>
    </div>
  );
}
