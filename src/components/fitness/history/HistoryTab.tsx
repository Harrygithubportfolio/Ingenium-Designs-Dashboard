'use client';

import { useState } from 'react';
import SessionsView from './SessionsView';
import ExercisesView from './ExercisesView';
import AnalyticsView from './AnalyticsView';

type SubTab = 'sessions' | 'exercises' | 'analytics';

export default function HistoryTab() {
  const [subTab, setSubTab] = useState<SubTab>('sessions');

  return (
    <div className="flex-1 flex flex-col gap-3 overflow-hidden">
      {/* Sub-tab toggle */}
      <div className="flex items-center bg-inner rounded-lg border border-edge p-0.5 w-fit flex-shrink-0">
        <button
          type="button"
          onClick={() => setSubTab('sessions')}
          className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
            subTab === 'sessions'
              ? 'bg-accent/20 text-accent border border-accent/40'
              : 'text-sub hover:text-heading border border-transparent'
          }`}
        >
          Sessions
        </button>
        <button
          type="button"
          onClick={() => setSubTab('exercises')}
          className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
            subTab === 'exercises'
              ? 'bg-accent/20 text-accent border border-accent/40'
              : 'text-sub hover:text-heading border border-transparent'
          }`}
        >
          Exercises
        </button>
        <button
          type="button"
          onClick={() => setSubTab('analytics')}
          className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
            subTab === 'analytics'
              ? 'bg-accent/20 text-accent border border-accent/40'
              : 'text-sub hover:text-heading border border-transparent'
          }`}
        >
          Analytics
        </button>
      </div>

      {/* Content */}
      {subTab === 'sessions' && <SessionsView />}
      {subTab === 'exercises' && <ExercisesView />}
      {subTab === 'analytics' && <AnalyticsView />}
    </div>
  );
}
