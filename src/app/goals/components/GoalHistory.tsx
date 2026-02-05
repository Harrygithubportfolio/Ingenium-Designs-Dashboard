"use client";

import { DailyGoal } from "../utils/goalTypes";
import DailyGoalCard from "./DailyGoalCard";

export default function GoalHistory({
  goals,
  onReview,
}: {
  goals: DailyGoal[];
  onReview: (goal: DailyGoal) => void;
}) {
  const groupedByDate = goals.reduce(
    (acc, goal) => {
      const date = goal.date;
      if (!acc[date]) acc[date] = [];
      acc[date].push(goal);
      return acc;
    },
    {} as Record<string, DailyGoal[]>
  );

  const sortedDates = Object.keys(groupedByDate).sort().reverse();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date.getTime() === today.getTime()) return "Today";
    if (date.getTime() === new Date(today.getTime() - 86400000).getTime()) {
      return "Yesterday";
    }

    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const calculateStats = (dayGoals: DailyGoal[]) => {
    const completed = dayGoals.filter((g) => g.completed || (g.review && g.review.rating >= 4)).length;
    const reviewed = dayGoals.filter((g) => g.review).length;
    return { completed, total: dayGoals.length, reviewed };
  };

  return (
    <div className="space-y-6">
      {sortedDates.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400">No goals yet. Start by adding some goals!</p>
        </div>
      ) : (
        sortedDates.map((date) => {
          const dayGoals = groupedByDate[date];
          const stats = calculateStats(dayGoals);
          const isToday = new Date(date + "T00:00:00").toDateString() === new Date().toDateString();

          return (
            <div key={date}>
              {/* Date Header */}
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-sm font-semibold text-white flex-1">
                  {formatDate(date)}
                </h3>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span>
                    {stats.completed}/{stats.total} completed
                  </span>
                  {stats.reviewed > 0 && (
                    <>
                      <span>•</span>
                      <span>{stats.reviewed} reviewed</span>
                    </>
                  )}
                </div>
              </div>

              {/* Goals Grid */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {dayGoals.map((goal) => (
                  <DailyGoalCard
                    key={goal.id}
                    goal={goal}
                    onToggleComplete={() => {}}
                    onReview={onReview}
                    isReviewTime={!goal.review && !isToday}
                  />
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
