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