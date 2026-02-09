'use client';

import { useState, useEffect } from 'react';
import {
  DailyFocus,
  FocusTask,
  getDailyMorningPrompt,
  generateId,
  getTodayString,
} from '../utils/focusTypes';
import { supabase } from '@/lib/supabaseClient';

interface Goal {
  id: string;
  title: string;
  status: string;
  milestones?: { id: string; title: string; completed: boolean }[];
}

interface MorningFocusProps {
  focus: DailyFocus | null;
  onFocusChange: (focus: DailyFocus) => void;
}

export default function MorningFocus({ focus, onFocusChange }: MorningFocusProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isEditing, setIsEditing] = useState(!focus);
  const [primaryFocus, setPrimaryFocus] = useState(focus?.primaryFocus || '');
  const [intentionNote, setIntentionNote] = useState(focus?.intentionNote || '');
  const [supportingTasks, setSupportingTasks] = useState<FocusTask[]>(focus?.supportingTasks || []);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showGoalPicker, setShowGoalPicker] = useState(false);

  const morningPrompt = getDailyMorningPrompt();

  // Load goals from Supabase
  useEffect(() => {
    const loadGoals = async () => {
      try {
        const { data } = await supabase
          .from('goals')
          .select('*, milestones(*)')
          .in('status', ['In Progress', 'Not Started'])
          .order('created_at', { ascending: false });
        if (data) setGoals(data);
      } catch {
        // Silently fail
      }
    };
    loadGoals();
  }, []);

  // Sync with focus prop
  useEffect(() => {
    if (focus) {
      setPrimaryFocus(focus.primaryFocus);
      setIntentionNote(focus.intentionNote || '');
      setSupportingTasks(focus.supportingTasks);
      setIsEditing(false);
    }
  }, [focus]);

  const handleSave = () => {
    if (!primaryFocus.trim()) return;

    const newFocus: DailyFocus = {
      id: focus?.id || generateId(),
      date: getTodayString(),
      primaryFocus: primaryFocus.trim(),
      primaryFocusCompleted: focus?.primaryFocusCompleted || false,
      supportingTasks,
      intentionNote: intentionNote.trim() || undefined,
      createdAt: focus?.createdAt || new Date().toISOString(),
    };

    onFocusChange(newFocus);
    setIsEditing(false);
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    const newTask: FocusTask = {
      id: generateId(),
      title: newTaskTitle.trim(),
      completed: false,
      priority: 'medium',
      source: 'manual',
    };
    setSupportingTasks([...supportingTasks, newTask]);
    setNewTaskTitle('');
  };

  const handleAddFromGoal = (goal: Goal, milestone?: { id: string; title: string }) => {
    const newTask: FocusTask = {
      id: generateId(),
      title: milestone ? milestone.title : goal.title,
      completed: false,
      priority: 'high',
      source: 'goal',
      goalId: goal.id,
      milestoneId: milestone?.id,
    };
    setSupportingTasks([...supportingTasks, newTask]);
    setShowGoalPicker(false);
  };

  const handleRemoveTask = (taskId: string) => {
    setSupportingTasks(supportingTasks.filter(t => t.id !== taskId));
  };

  const handleToggleTask = (taskId: string) => {
    const updatedTasks = supportingTasks.map(t =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    setSupportingTasks(updatedTasks);

    // Auto-save when toggling tasks
    if (focus) {
      const updatedFocus = { ...focus, supportingTasks: updatedTasks };
      onFocusChange(updatedFocus);
    }
  };

  const handleTogglePrimaryFocus = () => {
    if (!focus) return;
    const updatedFocus = { ...focus, primaryFocusCompleted: !focus.primaryFocusCompleted };
    onFocusChange(updatedFocus);
  };

  // Editing mode
  if (isEditing) {
    return (
      <div className="h-full bg-gradient-to-br from-[#1a1a22] to-[#14141a] rounded-2xl border border-[#2a2a33] p-5 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5 flex-shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Set Your Focus</h2>
            <p className="text-xs text-gray-500">What matters most today?</p>
          </div>
        </div>

        {/* Form content */}
        <div className="flex-1 min-h-0 overflow-y-auto space-y-5">
          {/* Primary Focus */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Today&apos;s Primary Focus
            </label>
            <input
              type="text"
              value={primaryFocus}
              onChange={(e) => setPrimaryFocus(e.target.value)}
              placeholder="What's the ONE thing you must accomplish today?"
              className="w-full px-4 py-3 bg-[#14141a] border border-[#2a2a33] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#3b82f6] transition-colors"
            />
          </div>

          {/* Intention Note */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <span className="text-amber-400">✨</span> {morningPrompt}
            </label>
            <textarea
              value={intentionNote}
              onChange={(e) => setIntentionNote(e.target.value)}
              placeholder="Set your intention..."
              rows={2}
              className="w-full px-4 py-3 bg-[#14141a] border border-[#2a2a33] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#3b82f6] transition-colors resize-none"
            />
          </div>

          {/* Supporting Tasks */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-300">Supporting Tasks</label>
              <span className="text-xs text-gray-500">{supportingTasks.length}/3 recommended</span>
            </div>

            {/* Task list */}
            <div className="space-y-2 mb-3">
              {supportingTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-3 bg-[#14141a] border border-[#2a2a33] rounded-lg group"
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    task.source === 'goal' ? 'bg-[#3b82f6]' : 'bg-gray-500'
                  }`} />
                  <span className="flex-1 text-sm text-gray-300">{task.title}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTask(task.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            {/* Add task input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                placeholder="Add a supporting task..."
                className="flex-1 px-3 py-2 bg-[#14141a] border border-[#2a2a33] rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#3b82f6] transition-colors"
              />
              <button
                type="button"
                onClick={handleAddTask}
                disabled={!newTaskTitle.trim()}
                className="px-3 py-2 bg-[#22222c] border border-[#2a2a33] rounded-lg text-sm text-gray-300 hover:bg-[#2a2a33] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add
              </button>
            </div>

            {/* Import from goals */}
            {goals.length > 0 && (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setShowGoalPicker(!showGoalPicker)}
                  className="text-xs text-[#3b82f6] hover:text-[#60a5fa] transition-colors flex items-center gap-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  Import from goals
                </button>

                {showGoalPicker && (
                  <div className="mt-2 p-3 bg-[#14141a] border border-[#2a2a33] rounded-lg max-h-48 overflow-y-auto">
                    {goals.map((goal) => (
                      <div key={goal.id} className="mb-2 last:mb-0">
                        <button
                          type="button"
                          onClick={() => handleAddFromGoal(goal)}
                          className="w-full text-left px-2 py-1.5 text-sm text-gray-300 hover:bg-[#22222c] rounded transition-colors"
                        >
                          {goal.title}
                        </button>
                        {goal.milestones?.filter(m => !m.completed).slice(0, 3).map((milestone) => (
                          <button
                            key={milestone.id}
                            type="button"
                            onClick={() => handleAddFromGoal(goal, milestone)}
                            className="w-full text-left px-4 py-1 text-xs text-gray-400 hover:bg-[#22222c] rounded transition-colors"
                          >
                            ↳ {milestone.title}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Save button */}
        <div className="flex-shrink-0 pt-4 border-t border-[#2a2a33] mt-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={!primaryFocus.trim()}
            className="w-full py-3 bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] rounded-xl text-white font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Set Today&apos;s Focus
          </button>
        </div>
      </div>
    );
  }

  // Display mode
  return (
    <div className="h-full bg-gradient-to-br from-[#1a1a22] to-[#14141a] rounded-2xl border border-[#2a2a33] p-5 flex flex-col overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Today&apos;s Focus</h2>
            <p className="text-xs text-gray-500">Stay intentional</p>
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
        {/* Primary Focus */}
        <div
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            focus?.primaryFocusCompleted
              ? 'bg-green-500/10 border-green-500/30'
              : 'bg-[#3b82f6]/10 border-[#3b82f6]/30 hover:border-[#3b82f6]/50'
          }`}
          onClick={handleTogglePrimaryFocus}
        >
          <div className="flex items-start gap-3">
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
              focus?.primaryFocusCompleted
                ? 'bg-green-500 border-green-500'
                : 'border-[#3b82f6]'
            }`}>
              {focus?.primaryFocusCompleted && (
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <p className="text-xs text-[#3b82f6] font-medium uppercase tracking-wide mb-1">Primary Focus</p>
              <p className={`text-lg font-medium ${focus?.primaryFocusCompleted ? 'text-gray-400 line-through' : 'text-white'}`}>
                {focus?.primaryFocus}
              </p>
            </div>
          </div>
        </div>

        {/* Intention Note */}
        {focus?.intentionNote && (
          <div className="p-3 bg-[#14141a] rounded-lg border border-[#2a2a33]">
            <p className="text-xs text-amber-400 mb-1">✨ Intention</p>
            <p className="text-sm text-gray-300 italic">&ldquo;{focus.intentionNote}&rdquo;</p>
          </div>
        )}

        {/* Supporting Tasks */}
        {supportingTasks.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Supporting Tasks</p>
            <div className="space-y-2">
              {supportingTasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                    task.completed
                      ? 'bg-[#14141a] border-[#2a2a33]'
                      : 'bg-[#14141a] border-[#2a2a33] hover:border-[#3a3a44]'
                  }`}
                  onClick={() => handleToggleTask(task.id)}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    task.completed
                      ? 'bg-green-500 border-green-500'
                      : 'border-gray-500'
                  }`}>
                    {task.completed && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className={`flex-1 text-sm ${task.completed ? 'text-gray-500 line-through' : 'text-gray-300'}`}>
                    {task.title}
                  </span>
                  {task.source === 'goal' && (
                    <span className="text-[10px] text-[#3b82f6] bg-[#3b82f6]/10 px-2 py-0.5 rounded-full">
                      Goal
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
