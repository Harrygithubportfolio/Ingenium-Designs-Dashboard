"use client";

import { useState } from "react";
import { DailyGoal } from "../utils/goalTypes";

export default function EveningReviewModal({
  goal,
  onClose,
  onComplete,
}: {
  goal: DailyGoal;
  onClose: () => void;
  onComplete: (
    goalId: string,
    rating: number,
    notes: string,
    carryOver: boolean
  ) => void;
}) {
  const [rating, setRating] = useState(3);
  const [notes, setNotes] = useState("");
  const [carryOver, setCarryOver] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    onComplete(goal.id, rating, notes, carryOver);
    setSubmitted(true);
    setTimeout(onClose, 500);
  };

  const priorityColors: Record<string, string> = {
    High: "text-red-400",
    Medium: "text-yellow-400",
    Low: "text-blue-400",
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className={`w-full max-w-md bg-[#1a1a22] border border-[#2a2a33] rounded-xl shadow-xl transition-all ${
            submitted ? "scale-95 opacity-0" : "scale-100 opacity-100"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-5 border-b border-[#2a2a33]">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-1">
                  {goal.title}
                </h3>
                <p className={`text-xs ${priorityColors[goal.priority]}`}>
                  {goal.priority} Priority • {goal.category}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition"
              >
                ✕
              </button>
            </div>
            {goal.description && (
              <p className="text-xs text-gray-400">{goal.description}</p>
            )}
          </div>

          {/* Content */}
          <div className="p-5 space-y-5">
            {/* Rating Section */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                How did you do today?
              </label>
              <div className="flex justify-between gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`flex-1 py-2 rounded-lg transition ${
                      star <= rating
                        ? "bg-yellow-500 text-white"
                        : "bg-[#14141a] border border-[#2a2a33] text-gray-400 hover:border-yellow-500"
                    }`}
                  >
                    {star === 1 ? "😞" : star === 2 ? "😐" : star === 3 ? "😌" : star === 4 ? "😊" : "🎉"}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                {rating === 1 && "Not completed"}
                {rating === 2 && "Made little progress"}
                {rating === 3 && "Made good progress"}
                {rating === 4 && "Completed"}
                {rating === 5 && "Exceeded expectations"}
              </p>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What worked well? What didn't? Next steps?"
                rows={3}
                className="w-full px-3 py-2 bg-[#14141a] border border-[#2a2a33] rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#3b82f6] resize-none"
              />
            </div>

            {/* Carry Over */}
            {rating < 5 && (
              <div className="flex items-start gap-3 p-3 bg-[#14141a] rounded-lg border border-[#2a2a33]">
                <input
                  type="checkbox"
                  id="carryover"
                  checked={carryOver}
                  onChange={(e) => setCarryOver(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded cursor-pointer accent-[#3b82f6]"
                />
                <label htmlFor="carryover" className="text-sm text-gray-300">
                  Continue this goal tomorrow
                </label>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-[#2a2a33] flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg bg-[#14141a] border border-[#2a2a33] text-white hover:border-[#3a3a44] transition text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="flex-1 px-4 py-2 rounded-lg bg-[#3b82f6] hover:bg-[#2563eb] text-white font-medium transition text-sm"
            >
              Complete Review
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
