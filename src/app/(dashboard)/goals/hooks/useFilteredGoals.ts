import { useMemo } from "react";
import { useGoals } from "@/store/useGoals";

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 } as const;

export function useFilteredGoals() {
  const goals = useGoals((s) => s.goals);
  const filterStatus = useGoals((s) => s.filterStatus);
  const filterCategory = useGoals((s) => s.filterCategory);
  const filterPriority = useGoals((s) => s.filterPriority);
  const sortField = useGoals((s) => s.sortField);
  const sortDirection = useGoals((s) => s.sortDirection);

  return useMemo(() => {
    let filtered = [...goals];

    if (filterStatus !== "all") {
      filtered = filtered.filter((g) => g.status === filterStatus);
    }
    if (filterCategory !== "all") {
      filtered = filtered.filter((g) => g.category === filterCategory);
    }
    if (filterPriority !== "all") {
      filtered = filtered.filter((g) => g.priority === filterPriority);
    }

    filtered.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "priority":
          cmp = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
          break;
        case "progress":
          cmp = a.progress - b.progress;
          break;
        case "target_date":
          cmp = (a.target_date ?? "9999").localeCompare(b.target_date ?? "9999");
          break;
        case "title":
          cmp = a.title.localeCompare(b.title);
          break;
        default:
          cmp = a.created_at.localeCompare(b.created_at);
      }
      return sortDirection === "desc" ? -cmp : cmp;
    });

    return filtered;
  }, [goals, filterStatus, filterCategory, filterPriority, sortField, sortDirection]);
}
