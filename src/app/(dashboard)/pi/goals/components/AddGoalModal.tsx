"use client";

import { useState } from "react";
import { useGoals } from "@/store/useGoals";
import Modal from "./Modal";

interface AddGoalModalProps {
  onClose: () => void;
}

export default function AddGoalModal({ onClose }: AddGoalModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const addGoal = useGoals((s) => s.addGoal);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    await addGoal({ title: title.trim(), description: description.trim() });
    setSaving(false);
    onClose();
  };

  return (
    <Modal onClose={onClose}>
      <h2 className="text-2xl font-bold text-heading mb-6">New Goal</h2>

      <div className="space-y-5">
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
            className="w-full rounded-xl border border-edge bg-surface px-4 py-4 text-lg text-heading placeholder-gray-600 focus:outline-none focus:border-accent transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-sub mb-2">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add some details..."
            rows={3}
            className="w-full rounded-xl border border-edge bg-surface px-4 py-4 text-base text-heading placeholder-gray-600 focus:outline-none focus:border-accent transition-colors resize-none"
          />
        </div>
      </div>

      <div className="flex gap-3 mt-8">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-xl border border-edge bg-surface px-6 py-4 text-base font-semibold text-sub active:bg-card transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!title.trim() || saving}
          className="flex-1 rounded-xl bg-gradient-to-r from-accent to-accent-secondary px-6 py-4 text-base font-semibold text-white active:opacity-80 transition-opacity disabled:opacity-40"
        >
          {saving ? "Saving..." : "Save Goal"}
        </button>
      </div>
    </Modal>
  );
}
