"use client";

import { supabase } from "@/lib/supabaseClient";
import { Goal } from "../utils/goalTypes";

export default function DeleteGoalModal({
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
  const handleDelete = async () => {
    const { error } = await supabase
      .from("goals")
      .delete()
      .eq("id", goal.id);

    if (error) {
      console.error(error);
      return;
    }

    setGoals(goals.filter((g) => g.id !== goal.id));
    close();
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={close}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="bg-[#1a1a22] border border-[#2a2a33] rounded-xl p-6 w-[90%] max-w-md shadow-xl">
          <h2 className="text-xl font-semibold mb-2">Delete Goal</h2>
          <p className="text-gray-400 mb-6">
            Are you sure you want to delete <span className="text-white font-medium">{goal.title}</span>?  
            This action cannot be undone.
          </p>

          <div className="flex gap-3">
            <button
              onClick={close}
              className="flex-1 py-2 rounded bg-gray-700 hover:bg-gray-600 transition"
            >
              Cancel
            </button>

            <button
              onClick={handleDelete}
              className="flex-1 py-2 rounded bg-red-700 hover:bg-red-600 transition"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </>
  );
}