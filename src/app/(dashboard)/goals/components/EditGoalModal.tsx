"use client";

import { useState } from "react";
import { useGoals, type Goal, type GoalStatus } from "@/store/useGoals";
import Modal from "./Modal";

const statuses: { value: GoalStatus; label: string; color: string }[] = [
  { value: "active", label: "Active", color: "bg-blue-500" },
  { value: "completed", label: "Completed", color: "bg-green-500" },
  { value: "archived", label: "Archived", color: "bg-gray-500" },
];

interface EditGoalModalProps {
  goal: Goal;
  onClose: () => void;
}

export default function EditGoalModal({ goal, onClose }: EditGoalModalProps) {
  const [title, setTitle] = useState(goal.title);
  const [description, setDescription] = useState(goal.description ?? "");
  const [status, setStatus] = useState<GoalStatus>(goal.status);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const updateGoal = useGoals((s) => s.updateGoal);
  const deleteGoal = useGoals((s) => s.deleteGoal);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    await updateGoal(goal.id, {
      title: title.trim(),
      description: description.trim(),
      status,
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

  return (
    <Modal onClose={onClose}>
      <h2 className="text-2xl font-bold text-white mb-6">Edit Goal</h2>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-label="Goal title"
            className="w-full rounded-xl border border-[#2a2a33] bg-[#0f0f14] px-4 py-4 text-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#3b82f6] transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            aria-label="Goal description"
            className="w-full rounded-xl border border-[#2a2a33] bg-[#0f0f14] px-4 py-4 text-base text-white placeholder-gray-600 focus:outline-none focus:border-[#3b82f6] transition-colors resize-none"
          />
        </div>

        {/* Status selector - large touch targets */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Status
          </label>
          <div className="flex gap-2">
            {statuses.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setStatus(s.value)}
                className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                  status === s.value
                    ? "border-2 border-[#3b82f6] bg-[#3b82f6]/10 text-white"
                    : "border border-[#2a2a33] bg-[#0f0f14] text-gray-400 active:bg-[#1a1a22]"
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-8">
        {/* Delete button */}
        <button
          type="button"
          onClick={handleDelete}
          className={`rounded-xl px-5 py-4 text-base font-semibold transition-colors ${
            confirmDelete
              ? "bg-red-600 text-white active:bg-red-700"
              : "border border-red-500/30 bg-red-500/10 text-red-400 active:bg-red-500/20"
          }`}
        >
          {confirmDelete ? "Confirm" : "Delete"}
        </button>

        <div className="flex-1" />

        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-[#2a2a33] bg-[#0f0f14] px-6 py-4 text-base font-semibold text-gray-400 active:bg-[#1a1a22] transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!title.trim() || saving}
          className="rounded-xl bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] px-8 py-4 text-base font-semibold text-white active:opacity-80 transition-opacity disabled:opacity-40"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </Modal>
  );
}
