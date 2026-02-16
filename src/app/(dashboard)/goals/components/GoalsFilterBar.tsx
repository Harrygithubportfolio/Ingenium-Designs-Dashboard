"use client";

import { useGoals, type SortField } from "@/store/useGoals";
import { GOAL_CATEGORIES, GOAL_PRIORITIES, type GoalCategory, type GoalPriority } from "@/lib/goals/types";

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: "created_at", label: "Date Created" },
  { value: "target_date", label: "Due Date" },
  { value: "priority", label: "Priority" },
  { value: "progress", label: "Progress" },
  { value: "title", label: "Title" },
];

export default function GoalsFilterBar() {
  const filterCategory = useGoals((s) => s.filterCategory);
  const filterPriority = useGoals((s) => s.filterPriority);
  const sortField = useGoals((s) => s.sortField);
  const sortDirection = useGoals((s) => s.sortDirection);
  const setFilterCategory = useGoals((s) => s.setFilterCategory);
  const setFilterPriority = useGoals((s) => s.setFilterPriority);
  const setSortField = useGoals((s) => s.setSortField);
  const setSortDirection = useGoals((s) => s.setSortDirection);

  return (
    <div className="flex-shrink-0 flex items-center gap-2 flex-wrap">
      {/* Category filter */}
      <select
        value={filterCategory}
        onChange={(e) => setFilterCategory(e.target.value as GoalCategory | "all")}
        className="px-3 py-1.5 rounded-lg bg-inner border border-edge text-sm text-sub focus:outline-none focus:border-accent/50 transition-colors cursor-pointer"
      >
        <option value="all">All Categories</option>
        {Object.entries(GOAL_CATEGORIES).map(([key, { label }]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>

      {/* Priority filter */}
      <select
        value={filterPriority}
        onChange={(e) => setFilterPriority(e.target.value as GoalPriority | "all")}
        className="px-3 py-1.5 rounded-lg bg-inner border border-edge text-sm text-sub focus:outline-none focus:border-accent/50 transition-colors cursor-pointer"
      >
        <option value="all">All Priorities</option>
        {Object.entries(GOAL_PRIORITIES).map(([key, { label }]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>

      {/* Sort */}
      <div className="ml-auto flex items-center gap-1">
        <select
          value={sortField}
          onChange={(e) => setSortField(e.target.value as SortField)}
          className="px-3 py-1.5 rounded-lg bg-inner border border-edge text-sm text-sub focus:outline-none focus:border-accent/50 transition-colors cursor-pointer"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
          className="p-1.5 rounded-lg border border-edge bg-inner text-sub hover:border-accent/40 transition-colors"
          title={sortDirection === "asc" ? "Ascending" : "Descending"}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {sortDirection === "asc" ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
            )}
          </svg>
        </button>
      </div>
    </div>
  );
}
