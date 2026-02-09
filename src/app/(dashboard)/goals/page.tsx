"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { DailyGoal } from "./utils/goalTypes";
import QuickAddGoalModal from "./components/QuickAddGoalModal";
import EveningReviewModal from "./components/EveningReviewModal";
import DailyGoalCard from "./components/DailyGoalCard";
import GoalHistory from "./components/GoalHistory";

export default function GoalsPage() {
  const [goals, setGoals] = useState<DailyGoal[]>([]);
  const [activeTab, setActiveTab] = useState<"today" | "tomorrow" | "review" | "history">(
    "today"
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [reviewingGoal, setReviewingGoal] = useState<DailyGoal | null>(null);

  // Get today's and tomorrow's date in YYYY-MM-DD format
  const today = new Date().toISOString().split("T")[0];
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = tomorrowDate.toISOString().split("T")[0];

  // Load goals from localStorage (in a real app, use Supabase)
  useEffect(() => {
    const savedGoals = localStorage.getItem("daily_goals");
    if (savedGoals) {
      try {
        setGoals(JSON.parse(savedGoals));
      } catch (e) {
        console.error("Failed to load goals", e);
      }
    }
  }, []);

  // Save goals to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("daily_goals", JSON.stringify(goals));
  }, [goals]);

  // Get today's and tomorrow's goals
  const todayGoals = goals.filter((g) => g.date === today);
  const tomorrowGoals = goals.filter((g) => g.date === tomorrow);

  // Get goals that need review (completed but not reviewed)
  const goalsForReview = todayGoals.filter(
    (g) => g.completed && !g.review
  );

  // Handle completion toggle
  const handleToggleComplete = (goalId: string) => {
    setGoals(
      goals.map((g) =>
        g.id === goalId
          ? { ...g, completed: !g.completed, completedAt: !g.completed ? new Date().toISOString() : undefined }
          : g
      )
    );
  };

  // Handle review submission
  const handleCompleteReview = (
    goalId: string,
    rating: number,
    notes: string,
    carryOver: boolean
  ) => {
    setGoals(
      goals.map((g) => {
        if (g.id === goalId) {
          return {
            ...g,
            review: {
              rating,
              notes,
              reviewedAt: new Date().toISOString(),
              carryOver,
            },
          };
        }
        return g;
      })
    );

    // If carrying over, create goal for tomorrow
    if (carryOver) {
      const goal = goals.find((g) => g.id === goalId);
      if (goal) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split("T")[0];

        const newGoal: DailyGoal = {
          id: `goal_${Date.now()}`,
          title: goal.title,
          description: goal.description,
          category: goal.category,
          date: tomorrowStr,
          completed: false,
          carriedOverFrom: goal.id,
          priority: goal.priority,
        };

        setGoals([...goals, newGoal]);
      }
    }

    setReviewingGoal(null);
  };

  // Calculate stats
  const completedToday = todayGoals.filter((g) => g.completed).length;
  const reviewedToday = todayGoals.filter((g) => g.review).length;
  const avgRating = todayGoals
    .filter((g) => g.review)
    .reduce((sum, g) => sum + (g.review?.rating || 0), 0) / (reviewedToday || 1);

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "morning";
    if (hour < 17) return "afternoon";
    return "evening";
  };

  const timeOfDay = getTimeOfDay();

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#0a0a0f]">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between gap-4 mb-4 px-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] flex items-center justify-center flex-shrink-0">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Daily Goals</h1>
            <p className="text-gray-500 text-xs">
              {timeOfDay === "morning"
                ? "Set your goals for today"
                : timeOfDay === "afternoon"
                  ? "Keep making progress!"
                  : "Time to review your day"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#3b82f6] hover:bg-[#2563eb] text-white text-sm font-medium transition-all flex-shrink-0"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span className="hidden sm:inline">Add Goal</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex-shrink-0 flex gap-2 mb-4 px-1 border-b border-[#2a2a33]">
        {(
          [
            { id: "today", label: "Today", count: todayGoals.length },
            { id: "tomorrow", label: "Tomorrow", count: tomorrowGoals.length },
            { id: "review", label: "Review", count: goalsForReview.length },
            { id: "history", label: "History", count: 0 },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition relative ${
              activeTab === tab.id
                ? "text-white"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-2 inline-block w-5 h-5 rounded-full bg-[#3b82f6] text-white text-xs flex items-center justify-center">
                {tab.count}
              </span>
            )}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3b82f6]" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto px-1">
        {activeTab === "today" && (
          <div className="max-w-4xl">
            {/* Stats Bar */}
            {todayGoals.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mb-4">
                <StatCard
                  label="Total Goals"
                  value={todayGoals.length}
                  color="blue"
                />
                <StatCard
                  label="Completed"
                  value={completedToday}
                  color="green"
                />
                <StatCard
                  label="Reviewed"
                  value={reviewedToday}
                  color="purple"
                />
              </div>
            )}

            {/* Goals List */}
            {todayGoals.length === 0 ? (
              <EmptyState
                icon="📝"
                title={
                  timeOfDay === "morning"
                    ? "No goals set for today yet"
                    : "No goals tracked today"
                }
                description="Click 'Add Goal' to set your goals for today and track your progress!"
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {todayGoals.map((goal) => (
                  <DailyGoalCard
                    key={goal.id}
                    goal={goal}
                    onToggleComplete={handleToggleComplete}
                    onReview={setReviewingGoal}
                    isReviewTime={false}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "tomorrow" && (
          <div className="max-w-4xl">
            {/* Stats Bar */}
            {tomorrowGoals.length > 0 && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                <StatCard
                  label="Goals Planned"
                  value={tomorrowGoals.length}
                  color="blue"
                />
                <StatCard
                  label="High Priority"
                  value={tomorrowGoals.filter((g) => g.priority === "High").length}
                  color="purple"
                />
              </div>
            )}

            {/* Goals List */}
            {tomorrowGoals.length === 0 ? (
              <EmptyState
                icon="🌅"
                title="No goals set for tomorrow yet"
                description="Plan ahead! Click 'Add Goal' to set your goals for tomorrow."
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {tomorrowGoals.map((goal) => (
                  <DailyGoalCard
                    key={goal.id}
                    goal={goal}
                    onToggleComplete={handleToggleComplete}
                    onReview={setReviewingGoal}
                    isReviewTime={false}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "review" && (
          <div className="max-w-4xl">
            {goalsForReview.length === 0 ? (
              <EmptyState
                icon="✅"
                title="All caught up!"
                description={
                  todayGoals.length === 0
                    ? "No goals to review. Set some goals first!"
                    : "Mark goals as complete to review them"
                }
              />
            ) : (
              <div>
                <p className="text-sm text-gray-400 mb-4">
                  Review your completed goals and rate your progress
                </p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {goalsForReview.map((goal) => (
                    <DailyGoalCard
                      key={goal.id}
                      goal={goal}
                      onToggleComplete={handleToggleComplete}
                      onReview={setReviewingGoal}
                      isReviewTime={true}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "history" && (
          <div className="max-w-4xl">
            <GoalHistory goals={goals} onReview={setReviewingGoal} />
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddModal && (
        <QuickAddGoalModal
          close={() => setShowAddModal(false)}
          date={activeTab === "tomorrow" ? tomorrow : today}
          goals={goals}
          setGoals={setGoals}
        />
      )}

      {reviewingGoal && (
        <EveningReviewModal
          goal={reviewingGoal}
          onClose={() => setReviewingGoal(null)}
          onComplete={handleCompleteReview}
        />
      )}
    </div>
  );
}

// Stat Card Component
function StatCard({
  label,
  value,
  color = "blue",
}: {
  label: string;
  value: number;
  color?: "blue" | "green" | "purple";
}) {
  const bgColors = {
    blue: "bg-blue-500/20 text-blue-300",
    green: "bg-green-500/20 text-green-300",
    purple: "bg-purple-500/20 text-purple-300",
  };

  return (
    <div className={`p-3 rounded-lg border border-[#2a2a33] ${bgColors[color]}`}>
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

// Empty State Component
function EmptyState({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-sm max-w-xs">{description}</p>
    </div>
  );
}
