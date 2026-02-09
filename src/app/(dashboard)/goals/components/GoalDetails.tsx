"use client";

import { useState } from "react";
import { Goal } from "../utils/goalTypes";
import EditGoalModal from "./EditGoalModal";
import DeleteGoalModal from "./DeleteGoalModal";
import MilestonesList from "./MilestonesList";

export default function GoalDetails({
  goal,
  goals,
  setGoals,
  isVisible,
  onClose,
}: {
  goal: Goal | null;
  goals: Goal[];
  setGoals: (goals: Goal[]) => void;
  isVisible: boolean;
  onClose?: () => void;
}) {
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  return (
    <div
      className={`
        h-full flex flex-col
        transition-all duration-300 ease-out
        transform
        ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10 pointer-events-none"}
        p-3 rounded-xl border border-[#2a2a33] bg-[#1a1a22] overflow-hidden
      `}
    >
      {!goal ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-[#22222c] flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <p className="text-gray-400 text-sm font-medium">No Goal Selected</p>
          <p className="text-gray-500 text-xs mt-1">Click on a goal to view details</p>
        </div>
      ) : (
        <>
          {/* Header - Fixed */}
          <div className="flex-shrink-0">
            <div className="flex justify-between items-start gap-2 mb-2">
              <h2 className="text-base font-semibold text-white truncate">{goal.title}</h2>

              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowEdit(true)}
                  className="p-1.5 rounded-lg bg-[#22222c] hover:bg-[#3b82f6]/20 text-gray-400 hover:text-[#3b82f6] transition-colors"
                  title="Edit Goal"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => setShowDelete(true)}
                  className="p-1.5 rounded-lg bg-[#22222c] hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                  title="Delete Goal"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>

                {onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-1.5 rounded-lg bg-[#22222c] hover:bg-[#2a2a33] text-gray-400 hover:text-white transition-colors"
                    title="Close Details"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {goal.description && (
              <p className="text-gray-400 text-xs line-clamp-2 mb-3">{goal.description}</p>
            )}
          </div>

          {/* Milestones - Scrollable */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <MilestonesList goal={goal} goals={goals} setGoals={setGoals} />
          </div>

          {showEdit && (
            <EditGoalModal
              close={() => setShowEdit(false)}
              goal={goal}
              goals={goals}
              setGoals={setGoals}
            />
          )}

          {showDelete && (
            <DeleteGoalModal
              close={() => setShowDelete(false)}
              goal={goal}
              goals={goals}
              setGoals={setGoals}
            />
          )}
        </>
      )}
    </div>
  );
}