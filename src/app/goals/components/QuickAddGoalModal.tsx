"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { DailyGoal } from "../utils/goalTypes";

export default function QuickAddGoalModal({
  close,
  date,
  goals,
  setGoals,
}: {
  close: () => void;
  date: string; // YYYY-MM-DD
  goals: DailyGoal[];
  setGoals: (goals: DailyGoal[]) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Personal");
  const [priority, setPriority] = useState<"Low" | "Medium" | "High">("Medium");
  const [loading, setLoading] = useState(false);

  const categories = [
    "Personal",
    "Work",
    "Health & Fitness",
    "Learning",
    "Creative",
    "Family",
    "Other",
  ];

  const handleSubmit = async () => {
    if (!title.trim()) return;

    setLoading(true);

    const newGoal: DailyGoal = {
      id: `goal_${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      category,
      date,
      completed: false,
      priority,
    };

    // In a real app, save to Supabase
    // For now, just update local state
    setGoals([...goals, newGoal]);
    close();
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={close}
      />

      <div className="fixed inset-y-0 right-0 w-full md:w-[420px] bg-[#1a1a22] border-l border-[#2a2a33] z-50 shadow-xl flex flex-col">
        <div className="p-4 border-b border-[#2a2a33] flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Add Goal for {date === new Date().toISOString().split("T")[0] ? "Today" : "Tomorrow"}
          </h2>
          <button
            onClick={close}
            className="text-gray-400 hover:text-white transition"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">Goal Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={date === new Date().toISOString().split("T")[0] ? "What do you want to accomplish today?" : "What do you want to accomplish tomorrow?"}
              className="w-full px-3 py-2 bg-[#14141a] border border-[#2a2a33] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#3b82f6]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add any notes or context..."
              rows={3}
              className="w-full px-3 py-2 bg-[#14141a] border border-[#2a2a33] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#3b82f6] resize-none"
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category-select" className="block text-sm text-gray-300 mb-2">Category</label>
            <select
              id="category-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-[#14141a] border border-[#2a2a33] rounded-lg text-white focus:outline-none focus:border-[#3b82f6]"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">Priority</label>
            <div className="flex gap-2">
              {(["Low", "Medium", "High"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition ${
                    priority === p
                      ? p === "High"
                        ? "bg-red-500 text-white"
                        : p === "Medium"
                          ? "bg-yellow-500 text-white"
                          : "bg-blue-500 text-white"
                      : "bg-[#14141a] border border-[#2a2a33] text-gray-400 hover:border-[#3a3a44]"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-4 border-t border-[#2a2a33] flex gap-2">
          <button
            type="button"
            onClick={close}
            className="flex-1 px-4 py-2 rounded-lg bg-[#14141a] border border-[#2a2a33] text-white hover:border-[#3a3a44] transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!title.trim() || loading}
            className="flex-1 px-4 py-2 rounded-lg bg-[#3b82f6] hover:bg-[#2563eb] text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? "Adding..." : "Add Goal"}
          </button>
        </div>
      </div>
    </>
  );
}
