"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Goal, Milestone } from "../utils/goalTypes";

export default function MilestonesList({
  goal,
  goals,
  setGoals,
}: {
  goal: Goal;
  goals: Goal[];
  setGoals: (goals: Goal[]) => void;
}) {
  const [newMilestone, setNewMilestone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAddMilestone = async () => {
    if (!newMilestone.trim()) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("milestones")
      .insert([
        {
          goal_id: goal.id,
          title: newMilestone,
          completed: false,
        },
      ])
      .select("*")
      .single();

    setLoading(false);

    if (error) {
      console.error(error);
      return;
    }

    const updatedGoal: Goal = {
      ...goal,
      milestones: [...(goal.milestones || []), data],
    };

    setGoals(goals.map((g) => (g.id === goal.id ? updatedGoal : g)));
    setNewMilestone("");
  };

  const toggleMilestone = async (m: Milestone) => {
    const { data, error } = await supabase
      .from("milestones")
      .update({ completed: !m.completed })
      .eq("id", m.id)
      .select("*")
      .single();

    if (error) {
      console.error(error);
      return;
    }

    const updatedGoal: Goal = {
      ...goal,
      milestones: goal.milestones?.map((ms) =>
        ms.id === m.id ? data : ms
      ),
    };

    setGoals(goals.map((g) => (g.id === goal.id ? updatedGoal : g)));
  };

  const deleteMilestone = async (m: Milestone) => {
    const { error } = await supabase
      .from("milestones")
      .delete()
      .eq("id", m.id);

    if (error) {
      console.error(error);
      return;
    }

    const updatedGoal: Goal = {
      ...goal,
      milestones: goal.milestones?.filter((ms) => ms.id !== m.id),
    };

    setGoals(goals.map((g) => (g.id === goal.id ? updatedGoal : g)));
  };

  const completedCount = goal.milestones?.filter((m) => m.completed).length ?? 0;
  const totalCount = goal.milestones?.length ?? 0;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-300">Milestones</h3>
        {totalCount > 0 && (
          <span className="text-xs text-gray-500">{completedCount}/{totalCount}</span>
        )}
      </div>

      {/* Add Milestone - Compact */}
      <div className="flex-shrink-0 flex gap-1.5 mb-2">
        <input
          className="flex-1 px-2 py-1.5 text-xs rounded-lg bg-[#111118] border border-[#2a2a33] text-white placeholder-gray-500 focus:outline-none focus:border-[#3b82f6]"
          placeholder="Add milestone..."
          value={newMilestone}
          onChange={(e) => setNewMilestone(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddMilestone()}
        />
        <button
          type="button"
          onClick={handleAddMilestone}
          disabled={loading}
          className="px-2.5 py-1.5 rounded-lg bg-[#3b82f6] hover:bg-[#2563eb] text-white text-xs font-medium transition disabled:opacity-50"
        >
          Add
        </button>
      </div>

      {/* Milestone List - Scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {goal.milestones?.length === 0 ? (
          <p className="text-gray-500 text-xs text-center py-4">No milestones yet</p>
        ) : (
          <div className="space-y-1">
            {goal.milestones?.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between p-2 rounded-lg bg-[#14141a] border border-[#22222c] group"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <input
                    type="checkbox"
                    title={`Mark "${m.title}" as ${m.completed ? 'incomplete' : 'complete'}`}
                    checked={m.completed}
                    onChange={() => toggleMilestone(m)}
                    className="w-3.5 h-3.5 flex-shrink-0 accent-[#3b82f6]"
                  />
                  <span
                    className={`text-xs truncate ${
                      m.completed ? "line-through text-gray-500" : "text-gray-300"
                    }`}
                  >
                    {m.title}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => deleteMilestone(m)}
                  className="text-gray-500 hover:text-red-400 transition opacity-0 group-hover:opacity-100 ml-1 flex-shrink-0"
                  title="Delete milestone"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}