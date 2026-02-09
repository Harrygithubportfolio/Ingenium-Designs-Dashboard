import { create } from "zustand";
import { supabase } from "@/lib/supabaseClient";

export type GoalStatus = "active" | "completed" | "archived";

export interface Goal {
  id: string;
  user_id: string | null;
  title: string;
  description: string;
  status: GoalStatus;
  created_at: string;
  updated_at: string;
}

interface GoalsState {
  goals: Goal[];
  loading: boolean;
  fetchGoals: () => Promise<void>;
  subscribeToRealtime: () => () => void;
  addGoal: (title: string, description?: string) => Promise<void>;
  updateGoal: (id: string, updates: Partial<Pick<Goal, "title" | "description" | "status">>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
}

export const useGoals = create<GoalsState>((set, get) => ({
  goals: [],
  loading: false,

  fetchGoals: async () => {
    set({ loading: true });
    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .order("created_at", { ascending: true });
    if (!error && data) set({ goals: data });
    set({ loading: false });
  },

  subscribeToRealtime: () => {
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

  addGoal: async (title, description = "") => {
    await supabase.from("goals").insert({ title, description });
  },

  updateGoal: async (id, updates) => {
    await supabase
      .from("goals")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id);
  },

  deleteGoal: async (id) => {
    await supabase.from("goals").delete().eq("id", id);
  },
}));
