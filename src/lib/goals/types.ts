export type GoalCategory = 'fitness' | 'career' | 'personal' | 'financial' | 'health' | 'learning' | 'creative' | 'social' | 'work';
export type GoalPriority = 'high' | 'medium' | 'low';
export type GoalStatus = 'active' | 'completed' | 'archived';

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
}

export interface Goal {
  id: string;
  user_id: string | null;
  title: string;
  description: string | null;
  status: GoalStatus;
  category: GoalCategory;
  priority: GoalPriority;
  target_date: string | null;
  progress: number;
  milestones: Milestone[];
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface GoalInput {
  title: string;
  description?: string;
  category?: GoalCategory;
  priority?: GoalPriority;
  target_date?: string | null;
  milestones?: Milestone[];
}

export interface GoalUpdate {
  title?: string;
  description?: string;
  status?: GoalStatus;
  category?: GoalCategory;
  priority?: GoalPriority;
  target_date?: string | null;
  progress?: number;
  milestones?: Milestone[];
  sort_order?: number;
}

export const GOAL_CATEGORIES: Record<GoalCategory, { label: string; colour: string }> = {
  fitness:    { label: 'Fitness',    colour: '#ef4444' },
  career:     { label: 'Career',    colour: '#f59e0b' },
  personal:   { label: 'Personal',  colour: '#3b82f6' },
  financial:  { label: 'Financial', colour: '#10b981' },
  health:     { label: 'Health',    colour: '#ec4899' },
  learning:   { label: 'Learning',  colour: '#8b5cf6' },
  creative:   { label: 'Creative',  colour: '#f97316' },
  social:     { label: 'Social',    colour: '#06b6d4' },
  work:       { label: 'Work',      colour: '#a855f7' },
};

export const GOAL_PRIORITIES: Record<GoalPriority, { label: string; colour: string }> = {
  high:   { label: 'High',   colour: '#ef4444' },
  medium: { label: 'Medium', colour: '#f59e0b' },
  low:    { label: 'Low',    colour: '#6b7280' },
};
