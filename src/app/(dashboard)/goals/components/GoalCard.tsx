"use client";

import type { Goal } from "@/lib/goals/types";
import { GOAL_CATEGORIES } from "@/lib/goals/types";
import ProgressRing from "@/components/shared/charts/ProgressRing";
import CategoryBadge from "./CategoryBadge";
import PriorityBadge from "./PriorityBadge";

const STATUS_DOT: Record<string, string> = {
  active: "bg-blue-400",
  completed: "bg-green-400",
  archived: "bg-gray-500",
};

interface GoalCardProps {
  goal: Goal;
  onTap: (goal: Goal) => void;
}

export default function GoalCard({ goal, onTap }: GoalCardProps) {
  const categoryColour = GOAL_CATEGORIES[goal.category]?.colour ?? "#3b82f6";
  const milestoneCount = goal.milestones?.length ?? 0;
  const completedMilestones = goal.milestones?.filter((m) => m.completed).length ?? 0;
  const milestonePct = milestoneCount > 0 ? Math.round((completedMilestones / milestoneCount) * 100) : 0;

  const isOverdue =
    goal.status === "active" &&
    goal.target_date &&
    goal.target_date < new Date().toISOString().split("T")[0];

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };

  return (
    <button
      type="button"
      onClick={() => onTap(goal)}
      className="relative w-full flex flex-col rounded-2xl border border-edge bg-gradient-to-br from-card to-inner p-4 text-left transition-all hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5 group"
      style={{ borderLeftColor: categoryColour, borderLeftWidth: 3 }}
    >
      {/* Status dot */}
      <span
        className={`absolute top-3 right-3 w-2 h-2 rounded-full ${STATUS_DOT[goal.status] ?? STATUS_DOT.active}`}
      />

      {/* Top: Category + Priority */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <CategoryBadge category={goal.category} />
        <PriorityBadge priority={goal.priority} />
      </div>

      {/* Title */}
      <h3 className="text-sm font-bold text-heading leading-snug line-clamp-2 mb-1">
        {goal.title}
      </h3>

      {/* Description */}
      <p className="text-xs text-dim line-clamp-2 mb-3 flex-1">
        {goal.description || "No description"}
      </p>

      {/* Bottom: Progress + Milestones + Due date */}
      <div className="flex items-center gap-3 mt-auto">
        <ProgressRing
          value={goal.progress}
          max={100}
          size={44}
          strokeWidth={4}
          colour={categoryColour}
          label={`${goal.progress}%`}
          className="flex-shrink-0 [&_span]:!text-[10px] [&_span]:!font-semibold"
        />

        <div className="flex-1 min-w-0 space-y-1">
          {milestoneCount > 0 && (
            <div>
              <span className="text-[10px] text-dim">
                {completedMilestones}/{milestoneCount} milestones
              </span>
              <div className="h-1 mt-0.5 rounded-full bg-elevated overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${milestonePct}%`, backgroundColor: categoryColour }}
                />
              </div>
            </div>
          )}
          {goal.target_date && (
            <span className={`text-[10px] block ${isOverdue ? "text-red-400 font-medium" : "text-dim"}`}>
              {isOverdue ? "Overdue" : "Due"} {formatDate(goal.target_date)}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
