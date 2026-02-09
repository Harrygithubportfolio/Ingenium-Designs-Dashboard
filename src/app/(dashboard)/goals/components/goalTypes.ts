export interface Milestone {
  id: string;
  goal_id: string;
  title: string;
  completed: boolean;
  due_date?: string | null;
  created_at?: string;
}

export interface Goal {
  id: string;
  title: string;
  description?: string | null;
  category_id?: string | null;
  deadline?: string | null;
  progress: number;
  status: string;
  priority: string;
  created_at?: string;

  // IMPORTANT: milestones may be undefined until fetched
  milestones?: Milestone[];
}

export interface Category {
  id: string;
  name: string;
  color?: string;
}