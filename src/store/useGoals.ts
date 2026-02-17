import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import type {
  Goal,
  GoalInput,
  GoalUpdate,
  GoalCategory,
  GoalPriority,
  GoalStatus,
} from "@/lib/goals/types";

// Re-export for backward compatibility
export type { Goal, GoalStatus } from "@/lib/goals/types";

export type SortField = "created_at" | "target_date" | "priority" | "progress" | "title";
export type SortDirection = "asc" | "desc";

interface GoalsState {
  goals: Goal[];
  loading: boolean;

  // Filters
  filterStatus: GoalStatus | "all";
  filterCategory: GoalCategory | "all";
  filterPriority: GoalPriority | "all";
  sortField: SortField;
  sortDirection: SortDirection;

  // Auto-transition guard (tracks which date transitions last ran for)
  _transitionRanForDate: string | null;

  // Data actions
  fetchGoals: () => Promise<void>;
  subscribeToRealtime: () => () => void;
  addGoal: (input: GoalInput) => Promise<void>;
  updateGoal: (id: string, updates: GoalUpdate) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  autoTransitionGoals: () => Promise<void>;

  // Filter/sort actions
  setFilterStatus: (status: GoalStatus | "all") => void;
  setFilterCategory: (category: GoalCategory | "all") => void;
  setFilterPriority: (priority: GoalPriority | "all") => void;
  setSortField: (field: SortField) => void;
  setSortDirection: (direction: SortDirection) => void;
}

export const useGoals = create<GoalsState>((set, get) => ({
  goals: [],
  loading: false,

  filterStatus: "active",
  filterCategory: "all",
  filterPriority: "all",
  sortField: "created_at",
  sortDirection: "desc",
  _transitionRanForDate: null,

  fetchGoals: async () => {
    set({ loading: true });
    const supabase = createClient();
    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("fetchGoals error:", error);
    } else if (data) {
      set({ goals: data as Goal[] });
    }
    set({ loading: false });
  },

  subscribeToRealtime: () => {
    const supabase = createClient();
    const channel = supabase
      .channel("goals-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "goals" },
        () => get().fetchGoals()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  addGoal: async (input) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      console.error("addGoal error: not authenticated");
      return;
    }
    const { error } = await supabase.from("goals").insert({
      user_id: user.id,
      title: input.title,
      description: input.description ?? "",
      category: input.category ?? "personal",
      priority: input.priority ?? "medium",
      target_date: input.target_date ?? null,
      milestones: input.milestones ?? [],
    });
    if (error) {
      console.error("addGoal error:", error);
      return;
    }
    await get().fetchGoals();
  },

  updateGoal: async (id, updates) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("goals")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      console.error("updateGoal error:", error);
      return;
    }
    await get().fetchGoals();
  },

  deleteGoal: async (id) => {
    const supabase = createClient();
    const { error } = await supabase.from("goals").delete().eq("id", id);
    if (error) {
      console.error("deleteGoal error:", error);
      return;
    }
    await get().fetchGoals();
  },

  autoTransitionGoals: async () => {
    const todayStr = new Date().toISOString().slice(0, 10);

    // Guard: only run once per calendar day
    if (get()._transitionRanForDate === todayStr) return;
    set({ _transitionRanForDate: todayStr });

    const goals = get().goals;
    if (goals.length === 0) return;

    const toArchive: string[] = [];
    const toComplete: string[] = [];

    for (const goal of goals) {
      if (goal.status !== "active") continue;

      if (goal.progress === 100) {
        toComplete.push(goal.id);
      } else if (goal.target_date && goal.target_date < todayStr) {
        toArchive.push(goal.id);
      }
    }

    if (toArchive.length === 0 && toComplete.length === 0) return;

    const supabase = createClient();
    const now = new Date().toISOString();

    if (toArchive.length > 0) {
      const { error } = await supabase
        .from("goals")
        .update({ status: "archived", updated_at: now })
        .in("id", toArchive);
      if (error) console.error("autoTransition archive error:", error);
    }

    if (toComplete.length > 0) {
      const { error } = await supabase
        .from("goals")
        .update({ status: "completed", updated_at: now })
        .in("id", toComplete);
      if (error) console.error("autoTransition complete error:", error);
    }

    await get().fetchGoals();
  },

  setFilterStatus: (status) => set({ filterStatus: status }),
  setFilterCategory: (category) => set({ filterCategory: category }),
  setFilterPriority: (priority) => set({ filterPriority: priority }),
  setSortField: (field) => set({ sortField: field }),
  setSortDirection: (direction) => set({ sortDirection: direction }),
}));
