import { Goal } from "./goalTypes";

export const calculateProgress = (goal: Goal) => {
  if (!goal.milestones.length) return goal.progress;
  const completed = goal.milestones.filter(m => m.completed).length;
  return Math.round((completed / goal.milestones.length) * 100);
};