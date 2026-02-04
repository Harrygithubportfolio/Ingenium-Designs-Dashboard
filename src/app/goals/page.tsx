"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import GoalDetails from "./components/GoalDetails";
import AddGoalModal from "./components/AddGoalModal";
import { supabase } from "@/lib/supabaseClient";
import { Goal } from "./utils/goalTypes";

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const detailsRef = useRef<HTMLDivElement>(null);
  const goalsGridRef = useRef<HTMLDivElement>(null);

  const selectedGoal = goals.find((g) => g.id === selectedGoalId) ?? null;

  // Calculate stats
  const totalGoals = goals.length;
  const completedGoals = goals.filter((g) => g.status === "Completed").length;
  const inProgressGoals = goals.filter((g) => g.status === "In Progress").length;
  const avgProgress = goals.length > 0
    ? Math.round(goals.reduce((sum, g) => sum + (g.progress || 0), 0) / goals.length)
    : 0;

  // Handle click outside to deselect goal
  const handleClickOutside = useCallback((event: MouseEvent) => {
    const target = event.target as Node;
    const isOutsideDetails = detailsRef.current && !detailsRef.current.contains(target);
    const isOutsideGoals = goalsGridRef.current && !goalsGridRef.current.contains(target);

    if (isOutsideDetails && isOutsideGoals) {
      const isModal = (target as Element).closest?.('[data-modal]');
      const isButton = (target as Element).closest?.('button');
      if (!isModal && !isButton) {
        setSelectedGoalId(null);
      }
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  // Load goals from Supabase
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("goals")
        .select("*, milestones(*)")
        .order("created_at", { ascending: true });
      if (data) setGoals(data);
    };

    load();

    const channel = supabase
      .channel("realtime-goals")
      .on("postgres_changes", { event: "*", schema: "public", table: "goals" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "milestones" }, () => load())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Compact Header */}
      <div className="flex-shrink-0 flex items-center justify-between gap-4 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Goals</h1>
            <p className="text-gray-500 text-xs">Track your long-term progress</p>
          </div>
        </div>

        {/* Inline Stats */}
        <div className="hidden md:flex items-center gap-2">
          <MiniStat label="Total" value={totalGoals} />
          <MiniStat label="Active" value={inProgressGoals} color="text-yellow-400" />
          <MiniStat label="Done" value={completedGoals} color="text-green-400" />
          <MiniStat label="Progress" value={`${avgProgress}%`} color="text-[#3b82f6]" />
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#3b82f6] hover:bg-[#2563eb] text-white text-sm font-medium transition-all flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="hidden sm:inline">New Goal</span>
        </button>
      </div>

      {/* Mobile Stats Row */}
      <div className="flex-shrink-0 md:hidden flex items-center gap-2 mb-3">
        <MiniStat label="Total" value={totalGoals} />
        <MiniStat label="Active" value={inProgressGoals} color="text-yellow-400" />
        <MiniStat label="Done" value={completedGoals} color="text-green-400" />
        <MiniStat label="Progress" value={`${avgProgress}%`} color="text-[#3b82f6]" />
      </div>

      {/* Main Content - Takes remaining space */}
      <div className="flex-1 min-h-0 flex gap-3 overflow-hidden">
        {/* Goals Grid - Expands/contracts based on selection */}
        <div
          ref={goalsGridRef}
          className={`bg-[#1a1a22] rounded-xl border border-[#2a2a33] p-3 flex flex-col overflow-hidden transition-all duration-300 ease-out ${
            selectedGoal ? 'flex-1 lg:flex-[2]' : 'flex-1'
          }`}
        >
          <div className="flex items-center justify-between mb-2 flex-shrink-0">
            <h2 className="text-sm font-semibold text-gray-300">Your Goals</h2>
            <span className="text-xs text-gray-500">{goals.length} goals</span>
          </div>

          {goals.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-[#22222c] flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <p className="text-gray-400 text-sm">No goals yet</p>
                <p className="text-gray-500 text-xs">Click &quot;New Goal&quot; to get started</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-y-auto">
              <div className={`grid gap-2 auto-rows-min transition-all duration-300 ${
                selectedGoal
                  ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
                  : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
              }`}>
                {goals.map((goal) => (
                  <CompactGoalCard
                    key={goal.id}
                    goal={goal}
                    selected={goal.id === selectedGoalId}
                    onClick={() => setSelectedGoalId(goal.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Details Panel - Slides in from right */}
        <div
          ref={detailsRef}
          className={`overflow-hidden transition-all duration-300 ease-out ${
            selectedGoal
              ? 'w-80 lg:w-96 opacity-100'
              : 'w-0 opacity-0'
          }`}
        >
          <div className="w-80 lg:w-96 h-full">
            <GoalDetails
              goal={selectedGoal}
              goals={goals}
              setGoals={setGoals}
              isVisible={!!selectedGoal}
              onClose={() => setSelectedGoalId(null)}
            />
          </div>
        </div>
      </div>

      {/* Add Goal Modal */}
      {showAddModal && (
        <div data-modal>
          <AddGoalModal
            close={() => setShowAddModal(false)}
            setGoals={setGoals}
            goals={goals}
          />
        </div>
      )}
    </div>
  );
}

// Mini Stat Component
function MiniStat({ label, value, color = "text-white" }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 bg-[#1a1a22] rounded-lg border border-[#2a2a33]">
      <span className="text-[10px] text-gray-500 uppercase">{label}</span>
      <span className={`text-sm font-bold ${color}`}>{value}</span>
    </div>
  );
}

// Compact Goal Card Component
function CompactGoalCard({ goal, selected, onClick }: { goal: Goal; selected: boolean; onClick: () => void }) {
  const milestones = goal.milestones ?? [];
  const completed = milestones.filter((m) => m.completed).length;
  const total = milestones.length;
  const progress = total === 0 ? goal.progress ?? 0 : Math.round((completed / total) * 100);

  const statusColors: Record<string, string> = {
    "In Progress": "bg-yellow-500",
    "Completed": "bg-green-500",
    "Not Started": "bg-gray-500",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg border transition-all ${
        selected
          ? "border-[#3b82f6] bg-[#3b82f6]/10"
          : "border-[#2a2a33] bg-[#14141a] hover:bg-[#1e1e26] hover:border-[#3a3a44]"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <h3 className="text-sm font-medium text-white truncate flex-1">{goal.title}</h3>
        <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${statusColors[goal.status] || "bg-gray-500"}`} />
      </div>

      {goal.description && (
        <p className="text-xs text-gray-500 line-clamp-1 mb-2">{goal.description}</p>
      )}

      <div className="flex items-center gap-2">
        <div className="flex-1 h-1 bg-[#22222c] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-[10px] text-gray-400 flex-shrink-0">{progress}%</span>
      </div>

      {total > 0 && (
        <p className="text-[10px] text-gray-500 mt-1">{completed}/{total} milestones</p>
      )}
    </button>
  );
}
