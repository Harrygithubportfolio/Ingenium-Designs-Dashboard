"use client";

import { useEffect, useState } from "react";
import { useGoals, type Goal, type GoalStatus } from "@/store/useGoals";

const STATUS_TABS: { id: GoalStatus | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "completed", label: "Completed" },
  { id: "archived", label: "Archived" },
];

export default function GoalsPage() {
  const goals = useGoals((s) => s.goals);
  const loading = useGoals((s) => s.loading);
  const fetchGoals = useGoals((s) => s.fetchGoals);
  const subscribeToRealtime = useGoals((s) => s.subscribeToRealtime);
  const addGoal = useGoals((s) => s.addGoal);
  const updateGoal = useGoals((s) => s.updateGoal);
  const deleteGoal = useGoals((s) => s.deleteGoal);

  const [activeTab, setActiveTab] = useState<GoalStatus | "all">("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  useEffect(() => {
    fetchGoals();
    const unsub = subscribeToRealtime();
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredGoals =
    activeTab === "all" ? goals : goals.filter((g) => g.status === activeTab);

  const activeCount = goals.filter((g) => g.status === "active").length;
  const completedCount = goals.filter((g) => g.status === "completed").length;
  const archivedCount = goals.filter((g) => g.status === "archived").length;

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#0a0a0f]">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between gap-4 mb-4 px-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Goals</h1>
            <p className="text-gray-500 text-xs">
              {activeCount} active &middot; {completedCount} completed &middot; {archivedCount} archived
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#3b82f6] hover:bg-[#2563eb] text-white text-sm font-medium transition-all flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="hidden sm:inline">Add Goal</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex-shrink-0 flex gap-2 mb-4 px-1 border-b border-[#2a2a33]">
        {STATUS_TABS.map((tab) => {
          const count =
            tab.id === "all"
              ? goals.length
              : tab.id === "active"
                ? activeCount
                : tab.id === "completed"
                  ? completedCount
                  : archivedCount;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium transition relative ${
                activeTab === tab.id ? "text-white" : "text-gray-400 hover:text-gray-300"
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span className="ml-2 inline-flex w-5 h-5 rounded-full bg-[#3b82f6]/20 text-[#3b82f6] text-xs items-center justify-center">
                  {count}
                </span>
              )}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3b82f6]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto px-1">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-3 border-[#3b82f6]/30 border-t-[#3b82f6] rounded-full animate-spin" />
          </div>
        ) : filteredGoals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#1a1a22] border border-[#2a2a33] flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              {activeTab === "all" ? "No goals yet" : `No ${activeTab} goals`}
            </h3>
            <p className="text-gray-400 text-sm max-w-xs">
              {activeTab === "all"
                ? "Click \"Add Goal\" to create your first goal!"
                : `You don't have any ${activeTab} goals right now.`}
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl">
            {filteredGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onEdit={() => setEditingGoal(goal)}
                onToggleComplete={async () => {
                  await updateGoal(goal.id, {
                    status: goal.status === "completed" ? "active" : "completed",
                  });
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddGoalOverlay
          onClose={() => setShowAddModal(false)}
          onSave={async (title, description) => {
            await addGoal(title, description);
            setShowAddModal(false);
          }}
        />
      )}

      {editingGoal && (
        <EditGoalOverlay
          goal={editingGoal}
          onClose={() => setEditingGoal(null)}
          onSave={async (updates) => {
            await updateGoal(editingGoal.id, updates);
            setEditingGoal(null);
          }}
          onDelete={async () => {
            await deleteGoal(editingGoal.id);
            setEditingGoal(null);
          }}
        />
      )}
    </div>
  );
}

/* ─── Goal Card ─── */

const statusConfig: Record<GoalStatus, { dot: string; bg: string; label: string }> = {
  active: { dot: "bg-blue-500", bg: "bg-blue-500/10 text-blue-400", label: "Active" },
  completed: { dot: "bg-green-500", bg: "bg-green-500/10 text-green-400", label: "Completed" },
  archived: { dot: "bg-gray-500", bg: "bg-gray-500/10 text-gray-400", label: "Archived" },
};

function GoalCard({
  goal,
  onEdit,
  onToggleComplete,
}: {
  goal: Goal;
  onEdit: () => void;
  onToggleComplete: () => void;
}) {
  const cfg = statusConfig[goal.status];

  return (
    <div
      className="group rounded-xl border border-[#2a2a33] bg-[#12121a] p-4 hover:border-[#3b82f6]/40 transition-colors cursor-pointer"
      onClick={onEdit}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.bg}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          {cfg.label}
        </span>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleComplete();
          }}
          className={`w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
            goal.status === "completed"
              ? "bg-green-500 border-green-500 text-white"
              : "border-[#3a3a44] hover:border-[#3b82f6]"
          }`}
          title={goal.status === "completed" ? "Mark active" : "Mark completed"}
        >
          {goal.status === "completed" && (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
      </div>

      <h3 className={`font-semibold text-sm mb-1 ${goal.status === "completed" ? "text-gray-400 line-through" : "text-white"}`}>
        {goal.title}
      </h3>

      {goal.description && (
        <p className="text-xs text-gray-500 line-clamp-2">{goal.description}</p>
      )}

      <p className="text-[10px] text-gray-600 mt-2">
        {new Date(goal.created_at).toLocaleDateString()}
      </p>
    </div>
  );
}

/* ─── Add Goal Overlay ─── */

function AddGoalOverlay({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (title: string, description: string) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    await onSave(title.trim(), description.trim());
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md mx-4 rounded-2xl border border-[#2a2a33] bg-[#12121a] p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-white mb-5">New Goal</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What do you want to achieve?"
              autoFocus
              className="w-full rounded-lg border border-[#2a2a33] bg-[#0f0f14] px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#3b82f6] transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add some details..."
              rows={3}
              className="w-full rounded-lg border border-[#2a2a33] bg-[#0f0f14] px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#3b82f6] transition-colors resize-none"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-[#2a2a33] bg-[#0f0f14] px-4 py-2.5 text-sm font-medium text-gray-400 hover:bg-[#1a1a22] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!title.trim() || saving}
            className="flex-1 rounded-lg bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {saving ? "Saving..." : "Save Goal"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Edit Goal Overlay ─── */

function EditGoalOverlay({
  goal,
  onClose,
  onSave,
  onDelete,
}: {
  goal: Goal;
  onClose: () => void;
  onSave: (updates: Partial<Pick<Goal, "title" | "description" | "status">>) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [title, setTitle] = useState(goal.title);
  const [description, setDescription] = useState(goal.description);
  const [status, setStatus] = useState<GoalStatus>(goal.status);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    await onSave({ title: title.trim(), description: description.trim(), status });
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    await onDelete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md mx-4 rounded-2xl border border-[#2a2a33] bg-[#12121a] p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-white mb-5">Edit Goal</h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="edit-goal-title" className="block text-sm font-medium text-gray-300 mb-1.5">Title</label>
            <input
              id="edit-goal-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Goal title"
              className="w-full rounded-lg border border-[#2a2a33] bg-[#0f0f14] px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#3b82f6] transition-colors"
            />
          </div>

          <div>
            <label htmlFor="edit-goal-desc" className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
            <textarea
              id="edit-goal-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Goal description"
              rows={3}
              className="w-full rounded-lg border border-[#2a2a33] bg-[#0f0f14] px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#3b82f6] transition-colors resize-none"
            />
          </div>

          <div>
            <label htmlFor="edit-goal-status" className="block text-sm font-medium text-gray-300 mb-1.5">Status</label>
            <div className="flex gap-2">
              {(["active", "completed", "archived"] as GoalStatus[]).map((s) => {
                const cfg = statusConfig[s];
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                      status === s
                        ? "border-2 border-[#3b82f6] bg-[#3b82f6]/10 text-white"
                        : "border border-[#2a2a33] bg-[#0f0f14] text-gray-400 hover:bg-[#1a1a22]"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            type="button"
            onClick={handleDelete}
            className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              confirmDelete
                ? "bg-red-600 text-white hover:bg-red-700"
                : "border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
            }`}
          >
            {confirmDelete ? "Confirm" : "Delete"}
          </button>

          <div className="flex-1" />

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#2a2a33] bg-[#0f0f14] px-4 py-2.5 text-sm font-medium text-gray-400 hover:bg-[#1a1a22] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!title.trim() || saving}
            className="rounded-lg bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] px-6 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
