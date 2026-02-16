"use client";

import { useState, useEffect } from "react";
import { useGoals } from "@/store/useGoals";
import type { Goal, GoalStatus, GoalCategory, GoalPriority, Milestone } from "@/lib/goals/types";
import { GOAL_CATEGORIES, GOAL_PRIORITIES } from "@/lib/goals/types";
import ProgressRing from "@/components/shared/charts/ProgressRing";
import MilestoneList from "./MilestoneList";
import Modal from "./Modal";

const STATUSES: { value: GoalStatus; label: string; colour: string }[] = [
  { value: "active", label: "Active", colour: "bg-blue-500" },
  { value: "completed", label: "Completed", colour: "bg-green-500" },
  { value: "archived", label: "Archived", colour: "bg-gray-500" },
];

interface GoalDetailModalProps {
  goal: Goal;
  onClose: () => void;
}

export default function GoalDetailModal({ goal, onClose }: GoalDetailModalProps) {
  const [title, setTitle] = useState(goal.title);
  const [description, setDescription] = useState(goal.description ?? "");
  const [status, setStatus] = useState<GoalStatus>(goal.status);
  const [category, setCategory] = useState<GoalCategory>(goal.category);
  const [priority, setPriority] = useState<GoalPriority>(goal.priority);
  const [targetDate, setTargetDate] = useState(goal.target_date ?? "");
  const [progress, setProgress] = useState(goal.progress);
  const [milestones, setMilestones] = useState<Milestone[]>(goal.milestones ?? []);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const updateGoal = useGoals((s) => s.updateGoal);
  const deleteGoal = useGoals((s) => s.deleteGoal);

  // Auto-calculate progress from milestones when they change
  useEffect(() => {
    if (milestones.length > 0) {
      const completed = milestones.filter((m) => m.completed).length;
      setProgress(Math.round((completed / milestones.length) * 100));
    }
  }, [milestones]);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    await updateGoal(goal.id, {
      title: title.trim(),
      description: description.trim(),
      status,
      category,
      priority,
      target_date: targetDate || null,
      progress,
      milestones,
    });
    setSaving(false);
    onClose();
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    await deleteGoal(goal.id);
    onClose();
  };

  const categoryColour = GOAL_CATEGORIES[category]?.colour ?? "#3b82f6";

  return (
    <Modal onClose={onClose} wide>
      <div className="flex flex-col gap-6 max-h-[80vh] overflow-y-auto pr-1">
        {/* Header with progress ring */}
        <div className="flex items-start gap-4">
          <ProgressRing
            value={progress}
            max={100}
            size={72}
            strokeWidth={5}
            colour={categoryColour}
            label={`${progress}%`}
            className="flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xl font-bold text-heading bg-transparent border-none outline-none placeholder-gray-600 focus:ring-0 p-0"
              placeholder="Goal title"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full mt-1 text-sm text-sub bg-transparent border-none outline-none placeholder-gray-600 resize-none focus:ring-0 p-0"
              placeholder="Add a description..."
            />
          </div>
        </div>

        {/* Category picker */}
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

        {/* Priority + Status row */}
        <div className="grid grid-cols-2 gap-4">
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

          <div>
            <label className="block text-xs font-medium text-dim uppercase tracking-wide mb-2">
              Status
            </label>
            <div className="flex gap-1.5">
              {STATUSES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStatus(s.value)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    status === s.value
                      ? "border-2 border-accent bg-accent/10 text-heading"
                      : "border border-edge bg-surface text-sub hover:bg-card"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${s.colour}`} />
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Target date */}
        <div>
          <label className="block text-xs font-medium text-dim uppercase tracking-wide mb-2">
            Target Date
          </label>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              title="Target date"
              className="rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-heading focus:outline-none focus:border-accent/50 transition-colors"
            />
            {targetDate && (
              <button
                type="button"
                onClick={() => setTargetDate("")}
                className="text-xs text-dim hover:text-sub transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Progress slider (only shown when no milestones — otherwise auto-calculated) */}
        {milestones.length === 0 && (
          <div>
            <label className="block text-xs font-medium text-dim uppercase tracking-wide mb-2">
              Progress
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={100}
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                className="flex-1 accent-[var(--accent)]"
              />
              <span className="text-sm font-semibold text-heading w-10 text-right">
                {progress}%
              </span>
            </div>
          </div>
        )}

        {/* Milestones */}
        <div>
          <label className="block text-xs font-medium text-dim uppercase tracking-wide mb-2">
            Milestones
          </label>
          <div className="rounded-xl border border-edge bg-surface p-3">
            <MilestoneList milestones={milestones} onChange={setMilestones} />
          </div>
          {milestones.length > 0 && (
            <p className="text-[10px] text-dim mt-1">
              Progress is auto-calculated from milestones
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2 border-t border-edge">
          <button
            type="button"
            onClick={handleDelete}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
              confirmDelete
                ? "bg-red-600 text-white hover:bg-red-700"
                : "border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
            }`}
          >
            {confirmDelete ? "Confirm Delete" : "Delete"}
          </button>

          <div className="flex-1" />

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-edge bg-surface px-5 py-2.5 text-sm font-semibold text-sub hover:bg-card transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!title.trim() || saving}
            className="rounded-xl bg-gradient-to-r from-accent to-accent-secondary px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
