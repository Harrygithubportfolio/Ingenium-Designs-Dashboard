"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/login?message=password_set");
    router.refresh();
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-surface">
      <form
        onSubmit={handleSetPassword}
        className="w-full max-w-sm space-y-5 rounded-2xl border border-edge bg-card p-8"
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-accent-secondary flex items-center justify-center">
            <svg className="w-7 h-7 text-heading" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-heading">Welcome to Life OS</h1>
            <p className="text-sm text-dim mt-1">Set your password to get started</p>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-sub mb-1.5">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="w-full rounded-lg border border-edge bg-surface px-3 py-2.5 text-heading text-sm placeholder-gray-600 focus:outline-none focus:border-accent transition-colors"
            placeholder="At least 8 characters"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-sub mb-1.5">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            className="w-full rounded-lg border border-edge bg-surface px-3 py-2.5 text-heading text-sm placeholder-gray-600 focus:outline-none focus:border-accent transition-colors"
            placeholder="Re-enter your password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-gradient-to-r from-accent to-accent-secondary px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? "Setting password..." : "Set Password"}
        </button>
      </form>
    </div>
  );
}
