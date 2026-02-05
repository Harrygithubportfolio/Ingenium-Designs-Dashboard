'use client';

import { DailyFocus } from '../utils/focusTypes';

interface DailyProgressProps {
  focus: DailyFocus | null;
}

export default function DailyProgress({ focus }: DailyProgressProps) {
  if (!focus) {
    return (
      <div className="h-full p-5 bg-gradient-to-br from-[#1a1a22] to-[#14141a] rounded-2xl border border-[#2a2a33] flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-[#22222c] flex items-center justify-center mb-3">
          <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-sm text-gray-400">No focus set yet</p>
        <p className="text-xs text-gray-500">Set your daily focus to track progress</p>
      </div>
    );
  }

  const totalTasks = focus.supportingTasks.length + 1; // +1 for primary focus
  const completedTasks = focus.supportingTasks.filter(t => t.completed).length + (focus.primaryFocusCompleted ? 1 : 0);
  const progress = Math.round((completedTasks / totalTasks) * 100);

  // Calculate ring properties
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="h-full p-5 bg-gradient-to-br from-[#1a1a22] to-[#14141a] rounded-2xl border border-[#2a2a33] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className={`w-40 h-40 rounded-full blur-3xl transition-all ${
          progress >= 100 ? 'bg-green-500/20' : 'bg-[#3b82f6]/10'
        }`} />
      </div>

      {/* Progress Ring */}
      <div className="relative mb-4">
        <svg className="w-32 h-32 transform -rotate-90">
          {/* Background ring */}
          <circle
            cx="64"
            cy="64"
            r={radius}
            fill="none"
            stroke="#22222c"
            strokeWidth="8"
          />
          {/* Progress ring */}
          <circle
            cx="64"
            cy="64"
            r={radius}
            fill="none"
            stroke="url(#progressGradient)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out"
          />
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={progress >= 100 ? '#22c55e' : '#3b82f6'} />
              <stop offset="100%" stopColor={progress >= 100 ? '#16a34a' : '#8b5cf6'} />
            </linearGradient>
          </defs>
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-bold ${progress >= 100 ? 'text-green-400' : 'text-white'}`}>
            {progress}%
          </span>
          <span className="text-xs text-gray-500">complete</span>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-center">
        <div>
          <p className="text-xl font-bold text-white">{completedTasks}</p>
          <p className="text-xs text-gray-500">Done</p>
        </div>
        <div className="w-px h-8 bg-[#2a2a33]" />
        <div>
          <p className="text-xl font-bold text-gray-400">{totalTasks - completedTasks}</p>
          <p className="text-xs text-gray-500">Remaining</p>
        </div>
      </div>

      {/* Completion message */}
      {progress >= 100 && (
        <div className="mt-4 px-4 py-2 bg-green-500/10 rounded-lg border border-green-500/20">
          <p className="text-sm text-green-400 font-medium flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Great work today!
          </p>
        </div>
      )}
    </div>
  );
}
