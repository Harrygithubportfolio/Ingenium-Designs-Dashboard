"use client";

import { DailyGoal } from "../utils/goalTypes";

export default function DailyGoalCard({
  goal,
  onToggleComplete,
  onReview,
  isReviewTime,
}: {
  goal: DailyGoal;
  onToggleComplete: (goalId: string) => void;
  onReview: (goal: DailyGoal) => void;
  isReviewTime: boolean;
}) {
  const categoryColors: Record<string, string> = {
    Work: "bg-blue-500/20 text-blue-300",
    Personal: "bg-purple-500/20 text-purple-300",
    "Health & Fitness": "bg-green-500/20 text-green-300",
    Learning: "bg-orange-500/20 text-orange-300",
    Creative: "bg-pink-500/20 text-pink-300",
    Family: "bg-red-500/20 text-red-300",
    Other: "bg-gray-500/20 text-gray-300",
  };

  const priorityColors: Record<string, string> = {
    High: "border-red-500 bg-red-500/5",
    Medium: "border-yellow-500 bg-yellow-500/5",
    Low: "border-blue-500 bg-blue-500/5",
  };

  const priorityDots: Record<string, string> = {
    High: "bg-red-500",
    Medium: "bg-yellow-500",
    Low: "bg-blue-500",
  };

  const hasReview = !!goal.review;

  return (
    <div
      className={`p-4 rounded-lg border-2 transition-all ${
        goal.completed
          ? "border-green-500/50 bg-green-500/5"
          : priorityColors[goal.priority]
      } ${goal.carriedOverFrom ? "ring-2 ring-yellow-500/30" : ""}`}
    >
      {/* Header with completion checkbox */}
      <div className="flex items-start gap-3 mb-2">
        <button
          onClick={() => onToggleComplete(goal.id)}
          className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition ${
            goal.completed
              ? "bg-green-500 border-green-500"
              : "border-gray-400 hover:border-gray-300"
          }`}
        >
          {goal.completed && (
            <svg
              className="w-3 h-3 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3
            className={`font-medium text-sm transition ${
              goal.completed
                ? "text-gray-400 line-through"
                : "text-white"
            }`}
          >
            {goal.title}
          </h3>

          {/* Meta Info */}
          <div className="flex flex-wrap gap-2 mt-1">
            <span
              className={`inline-block text-xs px-2 py-1 rounded ${
                categoryColors[goal.category] || categoryColors["Other"]
              }`}
            >
              {goal.category}
            </span>
            <div className="flex items-center gap-1">
              <span className={`inline-block w-2 h-2 rounded-full ${priorityDots[goal.priority]}`} />
              <span className="text-xs text-gray-400">{goal.priority}</span>
            </div>
            {goal.carriedOverFrom && (
              <span className="inline-block text-xs px-2 py-1 rounded bg-yellow-500/20 text-yellow-300">
                Carried over
              </span>
            )}
          </div>

          {/* Description */}
          {goal.description && (
            <p className="text-xs text-gray-400 mt-2">{goal.description}</p>
          )}

          {/* Review Info */}
          {hasReview && goal.review && (
            <div className="mt-2 p-2 bg-[#14141a] rounded text-xs">
              <div className="flex items-center gap-2 mb-1">
                <span>
                  {goal.review.rating === 1 && "😞"}
                  {goal.review.rating === 2 && "😐"}
                  {goal.review.rating === 3 && "😌"}
                  {goal.review.rating === 4 && "😊"}
                  {goal.review.rating === 5 && "🎉"}
                </span>
                <span className="text-gray-300">
                  {goal.review.rating === 1 && "Not completed"}
                  {goal.review.rating === 2 && "Made little progress"}
                  {goal.review.rating === 3 && "Made good progress"}
                  {goal.review.rating === 4 && "Completed"}
                  {goal.review.rating === 5 && "Exceeded expectations"}
                </span>
              </div>
              {goal.review.notes && (
                <p className="text-gray-400 italic">{goal.review.notes}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      {isReviewTime && !hasReview && (
        <button
          onClick={() => onReview(goal)}
          className="w-full mt-3 px-3 py-2 rounded-lg bg-[#3b82f6] hover:bg-[#2563eb] text-white text-xs font-medium transition"
        >
          Review This Goal
        </button>
      )}
    </div>
  );
}
