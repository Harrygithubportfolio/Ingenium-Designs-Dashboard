import { createClient } from '@/lib/supabase/server';

/** Extract authenticated user from the request. Server-side only (API routes). */
export async function getAuthUser(): Promise<{ id: string; email: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error('Not authenticated');
  }
  return { id: user.id, email: user.email ?? '' };
}
