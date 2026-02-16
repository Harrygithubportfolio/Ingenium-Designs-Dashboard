"use client";

import { GOAL_PRIORITIES, type GoalPriority } from "@/lib/goals/types";

interface PriorityBadgeProps {
  priority: GoalPriority;
}

export default function PriorityBadge({ priority }: PriorityBadgeProps) {
  const { label, colour } = GOAL_PRIORITIES[priority];

  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium bg-elevated text-sub">
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: colour }}
      />
      {label}
    </span>
  );
}
