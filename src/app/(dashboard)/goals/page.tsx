"use client";

import { useEffect, useState } from "react";
import { useGoals } from "@/store/useGoals";
import type { Goal, GoalStatus } from "@/lib/goals/types";
import { useFilteredGoals } from "./hooks/useFilteredGoals";
import GoalCard from "./components/GoalCard";
import AddGoalModal from "./components/AddGoalModal";
import GoalDetailModal from "./components/GoalDetailModal";
import GoalsSummaryStats from "./components/GoalsSummaryStats";
import GoalsFilterBar from "./components/GoalsFilterBar";

const STATUS_TABS: { value: GoalStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
];

export default function GoalsPage() {
  const goals = useGoals((s) => s.goals);
  const loading = useGoals((s) => s.loading);
  const fetchGoals = useGoals((s) => s.fetchGoals);
  const subscribeToRealtime = useGoals((s) => s.subscribeToRealtime);
  const autoTransitionGoals = useGoals((s) => s.autoTransitionGoals);
  const filterStatus = useGoals((s) => s.filterStatus);
  const setFilterStatus = useGoals((s) => s.setFilterStatus);

  const filteredGoals = useFilteredGoals();

  const [showAdd, setShowAdd] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

  useEffect(() => {
    fetchGoals().then(() => autoTransitionGoals());
    const unsub = subscribeToRealtime();
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent to-accent-secondary flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-heading" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-heading">Goals</h1>
            <p className="text-dim text-[11px]">Track your progress towards what matters</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-accent to-accent-secondary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Add Goal
        </button>
      </header>

      {/* Summary Stats */}
      {goals.length > 0 && <GoalsSummaryStats />}

      {/* Status Tabs */}
      {goals.length > 0 && (
        <div className="flex-shrink-0 flex items-center gap-1 bg-inner rounded-xl border border-edge p-1 w-fit">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setFilterStatus(tab.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterStatus === tab.value
                  ? "bg-accent/20 text-accent border border-accent/40"
                  : "text-sub hover:text-heading border border-transparent"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Filter/Sort Bar */}
      {goals.length > 0 && <GoalsFilterBar />}

      {/* Main Content */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      ) : goals.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-card border border-edge flex items-center justify-center">
            <svg className="w-10 h-10 text-dim" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <p className="text-xl text-sub font-medium">No goals yet</p>
          <p className="text-base text-dim">Add your first goal to start tracking progress</p>
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="mt-2 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent to-accent-secondary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Add Goal
          </button>
        </div>
      ) : filteredGoals.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <svg className="w-12 h-12 text-dim" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-base text-sub font-medium">No goals match your filters</p>
          <p className="text-sm text-dim">Try adjusting your filters to see more goals</p>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
            {filteredGoals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} onTap={setSelectedGoal} />
            ))}

            {/* Add goal placeholder */}
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-edge bg-surface/30 p-8 text-dim hover:text-sub hover:border-accent/30 transition-colors min-h-[180px]"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-sm font-medium">Add Goal</span>
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showAdd && <AddGoalModal onClose={() => setShowAdd(false)} />}
      {selectedGoal && (
        <GoalDetailModal
          goal={selectedGoal}
          onClose={() => setSelectedGoal(null)}
        />
      )}
    </div>
  );
}
