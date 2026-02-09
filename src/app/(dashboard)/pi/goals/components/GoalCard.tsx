"use client";

import type { Goal } from "@/store/useGoals";

const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
  active: { bg: "bg-blue-500/15", text: "text-blue-400", dot: "bg-blue-400" },
  completed: { bg: "bg-green-500/15", text: "text-green-400", dot: "bg-green-400" },
  archived: { bg: "bg-gray-500/15", text: "text-gray-400", dot: "bg-gray-500" },
};

interface GoalCardProps {
  goal: Goal;
  onTap: (goal: Goal) => void;
}

export default function GoalCard({ goal, onTap }: GoalCardProps) {
  const colors = statusColors[goal.status] || statusColors.active;

  return (
    <button
      type="button"
      onClick={() => onTap(goal)}
      className="w-full h-full flex flex-col justify-between rounded-2xl border border-[#2a2a33] bg-[#1a1a22] p-5 text-left transition-colors active:bg-[#22222c] active:border-[#3b82f6]/50"
    >
      {/* Top: Status badge */}
      <div className="flex items-center justify-between mb-3">
        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide ${colors.bg} ${colors.text}`}>
          <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
          {goal.status}
        </span>
      </div>

      {/* Middle: Title */}
      <h3 className="text-lg font-bold text-white leading-snug line-clamp-2 flex-1">
        {goal.title}
      </h3>

      {/* Bottom: Description preview */}
      <p className="text-sm text-gray-500 line-clamp-2 mt-2">
        {goal.description || "No description"}
      </p>
    </button>
  );
}
