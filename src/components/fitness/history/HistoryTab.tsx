'use client';

import { useState } from 'react';
import SessionsView from './SessionsView';
import ExercisesView from './ExercisesView';

type SubTab = 'sessions' | 'exercises';

export default function HistoryTab() {
  const [subTab, setSubTab] = useState<SubTab>('sessions');

  return (
    <div className="flex-1 flex flex-col gap-3 overflow-hidden">
      {/* Sub-tab toggle */}
      <div className="flex items-center bg-[#14141a] rounded-lg border border-[#2a2a33] p-0.5 w-fit flex-shrink-0">
        <button
          type="button"
          onClick={() => setSubTab('sessions')}
          className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
            subTab === 'sessions'
              ? 'bg-[#3b82f6]/20 text-[#3b82f6] border border-[#3b82f6]/40'
              : 'text-gray-400 hover:text-white border border-transparent'
          }`}
        >
          Sessions
        </button>
        <button
          type="button"
          onClick={() => setSubTab('exercises')}
          className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
            subTab === 'exercises'
              ? 'bg-[#3b82f6]/20 text-[#3b82f6] border border-[#3b82f6]/40'
              : 'text-gray-400 hover:text-white border border-transparent'
          }`}
        >
          Exercises
        </button>
      </div>

      {/* Content */}
      {subTab === 'sessions' ? <SessionsView /> : <ExercisesView />}
    </div>
  );
}
