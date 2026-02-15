import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";

export type GoalStatus = "active" | "completed" | "archived";

export interface Goal {
  id: string;
  user_id: string | null;
  title: string;
  description: string | null;
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
    const supabase = createClient();
    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) {
      console.error("fetchGoals error:", error);
    } else if (data) {
      set({ goals: data });
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

  addGoal: async (title, description = "") => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error("addGoal error: not authenticated");
      return;
    }
    const { error } = await supabase.from("goals").insert({ title, description, user_id: user.id });
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
}));
