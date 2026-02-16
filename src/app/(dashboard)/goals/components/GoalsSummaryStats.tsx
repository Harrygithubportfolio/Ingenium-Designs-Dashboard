"use client";

import { useGoals } from "@/store/useGoals";
import StatCard from "@/components/shared/charts/StatCard";

export default function GoalsSummaryStats() {
  const goals = useGoals((s) => s.goals);
  const today = new Date().toISOString().split("T")[0];

  const totalGoals = goals.length;
  const activeCount = goals.filter((g) => g.status === "active").length;
  const completedCount = goals.filter((g) => g.status === "completed").length;
  const completionRate = totalGoals > 0 ? Math.round((completedCount / totalGoals) * 100) : 0;
  const overdueCount = goals.filter(
    (g) => g.status === "active" && g.target_date && g.target_date < today
  ).length;

  return (
    <div className="flex-shrink-0 grid grid-cols-3 lg:grid-cols-5 gap-3">
      <StatCard label="Total Goals" value={totalGoals} />
      <StatCard
        label="Active"
        value={activeCount}
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        }
      />
      <StatCard
        label="Completed"
        value={completedCount}
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        }
      />
      <StatCard label="Completion" value={`${completionRate}%`} className="hidden lg:flex" />
      <StatCard
        label="Overdue"
        value={overdueCount}
        className={`hidden lg:flex ${overdueCount > 0 ? "border-red-500/30" : ""}`}
        icon={
          overdueCount > 0 ? (
            <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : undefined
        }
      />
    </div>
  );
}
