export type DailyGoal = {
  id: string;
  title: string;
  description?: string;
  category: string;
  date: string; // YYYY-MM-DD format
  completed: boolean;
  completedAt?: string; // timestamp
  carriedOverFrom?: string; // goal ID if carried over from previous day
  review?: {
    rating: number; // 1-5 stars
    notes?: string;
    reviewedAt: string;
    carryOver: boolean; // whether to carry to next day
  };
  priority: "Low" | "Medium" | "High";
};

export type Milestone = {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
};

export type Goal = {
  id: string;
  title: string;
  description: string;
  category: string;
  deadline?: string;
  progress: number;
  status: "Not Started" | "In Progress" | "Completed" | "Paused";
  priority: "Low" | "Medium" | "High";
  milestones: Milestone[];
};

export type Category = {
  id: string;
  name: string;
  color: string;
};