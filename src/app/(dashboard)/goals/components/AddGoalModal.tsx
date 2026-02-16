"use client";

import { useState } from "react";
import { useGoals } from "@/store/useGoals";
import type { GoalCategory, GoalPriority, Milestone } from "@/lib/goals/types";
import { GOAL_CATEGORIES, GOAL_PRIORITIES } from "@/lib/goals/types";
import MilestoneList from "./MilestoneList";
import Modal from "./Modal";

interface AddGoalModalProps {
  onClose: () => void;
}

export default function AddGoalModal({ onClose }: AddGoalModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<GoalCategory>("personal");
  const [priority, setPriority] = useState<GoalPriority>("medium");
  const [targetDate, setTargetDate] = useState("");
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [showMore, setShowMore] = useState(false);
  const [saving, setSaving] = useState(false);
  const addGoal = useGoals((s) => s.addGoal);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    await addGoal({
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
      target_date: targetDate || null,
      milestones,
    });
    setSaving(false);
    onClose();
  };

  return (
    <Modal onClose={onClose}>
      <h2 className="text-2xl font-bold text-heading mb-6">New Goal</h2>

      <div className="space-y-5 max-h-[65vh] overflow-y-auto pr-1">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-sub mb-2">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What do you want to achieve?"
            autoFocus
            className="w-full rounded-xl border border-edge bg-surface px-4 py-3 text-lg text-heading placeholder-gray-600 focus:outline-none focus:border-accent transition-colors"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-sub mb-2">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add some details..."
            rows={2}
            className="w-full rounded-xl border border-edge bg-surface px-4 py-3 text-base text-heading placeholder-gray-600 focus:outline-none focus:border-accent transition-colors resize-none"
          />
        </div>

        {/* More options toggle */}
        <button
          type="button"
          onClick={() => setShowMore(!showMore)}
          className="flex items-center gap-2 text-sm text-accent hover:text-accent-hover transition-colors"
        >
          <svg
            className={`w-4 h-4 transition-transform ${showMore ? "rotate-90" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          {showMore ? "Fewer options" : "More options"}
        </button>

        {/* Expandable options */}
        {showMore && (
          <div className="space-y-5 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Category */}
            <div>
              <label className="block text-xs font-medium text-dim uppercase tracking-wide mb-2">
                Category
              </label>
              <div className="flex flex-wrap gap-1.5">
                {(Object.entries(GOAL_CATEGORIES) as [GoalCategory, { label: string; colour: string }][]).map(
                  ([key, { label, colour }]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setCategory(key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        category === key
                          ? "ring-2 ring-offset-1 ring-offset-card"
                          : "opacity-50 hover:opacity-80"
                      }`}
                      style={{
                        backgroundColor: `${colour}20`,
                        color: colour,
                        ...(category === key ? { boxShadow: `0 0 0 2px ${colour}` } : {}),
                      }}
                    >
                      {label}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-medium text-dim uppercase tracking-wide mb-2">
                Priority
              </label>
              <div className="flex gap-1.5">
                {(Object.entries(GOAL_PRIORITIES) as [GoalPriority, { label: string; colour: string }][]).map(
                  ([key, { label, colour }]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setPriority(key)}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        priority === key
                          ? "border-2 border-accent bg-accent/10 text-heading"
                          : "border border-edge bg-surface text-sub hover:bg-card"
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: colour }}
                      />
                      {label}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Target date */}
            <div>
              <label className="block text-xs font-medium text-dim uppercase tracking-wide mb-2">
                Target Date (optional)
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                title="Target date"
                className="rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-heading focus:outline-none focus:border-accent/50 transition-colors"
              />
            </div>

            {/* Milestones */}
            <div>
              <label className="block text-xs font-medium text-dim uppercase tracking-wide mb-2">
                Milestones (optional)
              </label>
              <div className="rounded-xl border border-edge bg-surface p-3">
                <MilestoneList milestones={milestones} onChange={setMilestones} />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-6">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-xl border border-edge bg-surface px-6 py-3 text-base font-semibold text-sub hover:bg-card transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!title.trim() || saving}
          className="flex-1 rounded-xl bg-gradient-to-r from-accent to-accent-secondary px-6 py-3 text-base font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          {saving ? "Saving..." : "Save Goal"}
        </button>
      </div>
    </Modal>
  );
}
