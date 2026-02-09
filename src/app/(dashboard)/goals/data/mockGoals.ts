import { Goal } from "../utils/goalTypes";

export const mockGoals: Goal[] = [
  {
    id: "g1",
    title: "Lose 5kg and improve conditioning",
    description: "Train 4x per week, track calories, and improve sleep.",
    category: "Health & Fitness",
    deadline: "2025-04-30",
    progress: 40,
    status: "In Progress",
    priority: "High",
    milestones: [
      { id: "m1", title: "Lose first 1kg", completed: true },
      { id: "m2", title: "Hit 10k steps daily for 2 weeks", completed: false },
      { id: "m3", title: "Train 4x per week for a month", completed: false },
    ],
  },
  // add more if needed
];