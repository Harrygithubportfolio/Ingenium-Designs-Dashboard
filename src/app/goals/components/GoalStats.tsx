"use client";

import { Goal } from "../utils/goalTypes";

export default function GoalStats({ goals }: { goals: Goal[] }) {
  const totalGoals = goals.length;
  const completedGoals = goals.filter((g) => g.status === "Completed").length;
  const inProgressGoals = goals.filter((g) => g.status === "In Progress").length;

  const avgProgress =
    goals.length > 0
      ? Math.round(
          goals.reduce((sum, g) => sum + (g.progress || 0), 0) / goals.length
        )
      : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <StatCard
        label="Total Goals"
        value={totalGoals.toString()}
        sub="Across all categories"
      />
      <StatCard
        label="In Progress"
        value={inProgressGoals.toString()}
        sub="Actively being worked on"
      />
      <StatCard
        label="Completed"
        value={completedGoals.toString()}
        sub="Fully achieved"
      />
      <StatCard
        label="Average Progress"
        value={`${avgProgress}%`}
        sub="Overall completion"
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="p-4 rounded-xl border border-[#2a2a33] bg-[#1a1a22] flex flex-col gap-1">
      <span className="text-xs uppercase tracking-wide text-gray-400">
        {label}
      </span>
      <span className="text-2xl font-semibold">{value}</span>
      {sub && <span className="text-xs text-gray-500">{sub}</span>}
    </div>
  );
}