"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import CategorySelector from "./CategorySelector";
import { Goal } from "../utils/goalTypes";

export default function EditGoalModal({
  close,
  goal,
  goals,
  setGoals,
}: {
  close: () => void;
  goal: Goal;
  goals: Goal[];
  setGoals: (goals: Goal[]) => void;
}) {
  const [title, setTitle] = useState(goal.title);
  const [description, setDescription] = useState(goal.description || "");
  const [categoryId, setCategoryId] = useState<string | null>(goal.category || null);
  const [deadline, setDeadline] = useState(goal.deadline || "");
  const [status, setStatus] = useState(goal.status);
  const [priority, setPriority] = useState(goal.priority);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("goals")
      .update({
        title,
        description,
        category_id: categoryId,
        deadline: deadline || null,
        status,
        priority,
      })
      .eq("id", goal.id)
      .select("*")
      .single();

    setLoading(false);

    if (error) {
      console.error(error);
      return;
    }

    const updated = goals.map((g) => (g.id === goal.id ? data : g));
    setGoals(updated);

    close();
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={close}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full md:w-[450px] bg-[#1a1a22] border-l border-[#2a2a33] z-50 shadow-xl flex flex-col">
        <div className="p-4 border-b border-[#2a2a33] flex items-center justify-between">
          <h2 className="text-xl font-semibold">Edit Goal</h2>
          <button
            onClick={close}
            className="text-gray-400 hover:text-white transition"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="text-sm text-gray-300">Title *</label>
            <input
              title="Goal title"
              placeholder="Enter goal title"
              className="w-full mt-1 p-2 rounded bg-[#111118] border border-[#2a2a33] text-white"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm text-gray-300">Description</label>
            <textarea
              title="Goal description"
              placeholder="Enter goal description"
              className="w-full mt-1 p-2 rounded bg-[#111118] border border-[#2a2a33] text-white h-24"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <CategorySelector
            categoryId={categoryId}
            setCategoryId={setCategoryId}
          />

          <div>
            <label className="text-sm text-gray-300">Deadline</label>
            <input
              type="date"
              title="Goal deadline"
              placeholder="Select deadline"
              className="w-full mt-1 p-2 rounded bg-[#111118] border border-[#2a2a33] text-white"
              value={deadline || ""}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm text-gray-300">Status</label>
            <select
              title="Goal status"
              className="w-full mt-1 p-2 rounded bg-[#111118] border border-[#2a2a33] text-white"
              value={status}
              onChange={(e) => setStatus(e.target.value as Goal['status'])}
            >
              <option>Not Started</option>
              <option>In Progress</option>
              <option>Completed</option>
              <option>Paused</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-300">Priority</label>
            <select
              title="Goal priority"
              className="w-full mt-1 p-2 rounded bg-[#111118] border border-[#2a2a33] text-white"
              value={priority}
              onChange={(e) => setPriority(e.target.value as Goal['priority'])}
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#2a2a33] flex gap-2">
          <button
            onClick={close}
            className="flex-1 py-2 rounded bg-gray-700 hover:bg-gray-600 transition"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 py-2 rounded bg-[#3b82f6] hover:bg-[#2563eb] transition disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </>
  );
}