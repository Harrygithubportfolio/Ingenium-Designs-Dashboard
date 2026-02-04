"use client";

import { Goal } from "../utils/goalTypes";

export default function GoalCard({
  goal,
  selected,
  onClick,
}: {
  goal: Goal;
  selected: boolean;
  onClick: () => void;
}) {
  const milestones = goal.milestones ?? [];

  const completed = milestones.filter((m) => m.completed).length;
  const total = milestones.length;

  const progress =
    total === 0 ? goal.progress ?? 0 : Math.round((completed / total) * 100);

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-xl border cursor-pointer transition ${
        selected
          ? "border-blue-500 bg-[#1a1a22]"
          : "border-[#2a2a33] bg-[#14141a] hover:bg-[#1a1a22]"
      }`}
    >
      <h3 className="text-lg font-semibold">{goal.title}</h3>
      <p className="text-gray-400 text-sm">{goal.description}</p>

      <div className="mt-3 text-sm text-gray-400">
        {total === 0
          ? `${progress}% complete`
          : `${completed}/${total} milestones`}
      </div>
    </div>
  );
}