"use client";

import { useEffect, useState } from "react";
import { useGoals, type Goal } from "@/store/useGoals";
import GoalCard from "./components/GoalCard";
import AddGoalModal from "./components/AddGoalModal";
import EditGoalModal from "./components/EditGoalModal";

export default function PiGoalsPage() {
  const goals = useGoals((s) => s.goals);
  const loading = useGoals((s) => s.loading);
  const fetchGoals = useGoals((s) => s.fetchGoals);
  const subscribeToRealtime = useGoals((s) => s.subscribeToRealtime);

  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);

  useEffect(() => {
    fetchGoals();
    const unsub = subscribeToRealtime();
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Show max 6 goals in a 2×3 grid (fits 1280×720)
  const visibleGoals = goals.slice(0, 6);

  const activeCount = goals.filter((g) => g.status === "active").length;
  const completedCount = goals.filter((g) => g.status === "completed").length;

  return (
    <div className="h-[720px] w-[1280px] mx-auto flex flex-col bg-[#0a0a0f] overflow-hidden select-none">
      {/* ── Header bar ── */}
      <header className="flex items-center justify-between px-8 py-5 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Goals</h1>
            <p className="text-sm text-gray-500">
              {activeCount} active &middot; {completedCount} completed &middot; {goals.length} total
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-3 px-6 py-4 rounded-xl bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] text-white text-lg font-semibold active:opacity-80 transition-opacity"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Add Goal
        </button>
      </header>

      {/* ── Grid area ── */}
      <div className="flex-1 px-8 pb-6 min-h-0">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-[#3b82f6]/30 border-t-[#3b82f6] rounded-full animate-spin" />
          </div>
        ) : goals.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-[#1a1a22] border border-[#2a2a33] flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <p className="text-xl text-gray-400 font-medium">No goals yet</p>
            <p className="text-base text-gray-600">Tap &quot;Add Goal&quot; to get started</p>
          </div>
        ) : (
          <div className="h-full grid grid-cols-3 grid-rows-2 gap-4">
            {visibleGoals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} onTap={setEditing} />
            ))}
            {/* Fill empty slots so grid stays stable */}
            {Array.from({ length: Math.max(0, 6 - visibleGoals.length) }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="rounded-2xl border border-dashed border-[#2a2a33] bg-[#0f0f14]/50 flex items-center justify-center"
              >
                <button
                  type="button"
                  onClick={() => setShowAdd(true)}
                  className="flex flex-col items-center gap-2 text-gray-600 active:text-gray-400 transition-colors p-6"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-sm font-medium">Add Goal</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {showAdd && <AddGoalModal onClose={() => setShowAdd(false)} />}
      {editing && <EditGoalModal goal={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
