import { supabase } from '@/lib/supabaseClient';

/**
 * Gets the current authenticated user's ID from the data Supabase project.
 * Falls back to a default user ID for development when no auth session exists
 * (since auth is on a separate Supabase project).
 */
export async function getUserId(): Promise<string> {
  // Try to get user from auth — this may not work since auth is on a different Supabase project
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.id) return user.id;

  // Fallback: use a consistent default ID for the single-user dashboard
  return 'harry';
}
