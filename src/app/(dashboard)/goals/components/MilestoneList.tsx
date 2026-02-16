"use client";

import { useState } from "react";
import type { Milestone } from "@/lib/goals/types";

interface MilestoneListProps {
  milestones: Milestone[];
  onChange: (milestones: Milestone[]) => void;
  editable?: boolean;
}

export default function MilestoneList({ milestones, onChange, editable = true }: MilestoneListProps) {
  const [newTitle, setNewTitle] = useState("");

  const toggleMilestone = (id: string) => {
    onChange(
      milestones.map((m) =>
        m.id === id ? { ...m, completed: !m.completed } : m
      )
    );
  };

  const deleteMilestone = (id: string) => {
    onChange(milestones.filter((m) => m.id !== id));
  };

  const addMilestone = () => {
    const title = newTitle.trim();
    if (!title) return;
    onChange([
      ...milestones,
      { id: crypto.randomUUID(), title, completed: false },
    ]);
    setNewTitle("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addMilestone();
    }
  };

  const completedCount = milestones.filter((m) => m.completed).length;

  return (
    <div className="space-y-2">
      {milestones.length > 0 && (
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-dim uppercase tracking-wide">
            {completedCount}/{milestones.length} completed
          </span>
          {milestones.length > 0 && (
            <div className="flex-1 ml-3 h-1 rounded-full bg-elevated overflow-hidden">
              <div
                className="h-full rounded-full bg-accent transition-all duration-300"
                style={{
                  width: `${milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : 0}%`,
                }}
              />
            </div>
          )}
        </div>
      )}

      <div className="space-y-1">
        {milestones.map((milestone) => (
          <div
            key={milestone.id}
            className="flex items-center gap-2 group rounded-lg px-2 py-1.5 hover:bg-elevated/50 transition-colors"
          >
            <button
              type="button"
              onClick={() => toggleMilestone(milestone.id)}
              className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                milestone.completed
                  ? "bg-accent border-accent"
                  : "border-edge hover:border-accent/50"
              }`}
            >
              {milestone.completed && (
                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
            <span
              className={`flex-1 text-sm transition-colors ${
                milestone.completed ? "text-dim line-through" : "text-sub"
              }`}
            >
              {milestone.title}
            </span>
            {editable && (
              <button
                type="button"
                onClick={() => deleteMilestone(milestone.id)}
                className="opacity-0 group-hover:opacity-100 text-dim hover:text-red-400 transition-all p-0.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>

      {editable && (
        <div className="flex items-center gap-2 mt-1">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a milestone..."
            className="flex-1 rounded-lg border border-edge bg-surface px-3 py-1.5 text-sm text-heading placeholder-gray-600 focus:outline-none focus:border-accent/50 transition-colors"
          />
          <button
            type="button"
            onClick={addMilestone}
            disabled={!newTitle.trim()}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-accent bg-accent/10 hover:bg-accent/20 transition-colors disabled:opacity-30"
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
}
