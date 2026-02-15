import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Fetch a single daily record for the authenticated user.
 * Returns null if no row exists for the given date.
 */
export async function fetchDailyRecord<T>(
  supabase: SupabaseClient,
  table: string,
  dateColumn: string,
  date: string,
): Promise<T | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('user_id', user.id)
    .eq(dateColumn, date)
    .maybeSingle();

  if (error) {
    console.error(`fetchDailyRecord(${table}) error:`, error);
    return null;
  }
  return data as T | null;
}

/**
 * Upsert a daily record for the authenticated user.
 * Uses the (user_id, date) unique constraint for conflict resolution.
 */
export async function upsertDailyRecord<T>(
  supabase: SupabaseClient,
  table: string,
  dateColumn: string,
  date: string,
  payload: Partial<T>,
): Promise<T | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from(table)
    .upsert(
      { ...payload, user_id: user.id, [dateColumn]: date, updated_at: new Date().toISOString() },
      { onConflict: `user_id,${dateColumn}` },
    )
    .select()
    .single();

  if (error) {
    console.error(`upsertDailyRecord(${table}) error:`, error);
    return null;
  }
  return data as T;
}

/**
 * Fetch records within a date range for the authenticated user.
 */
export async function fetchDateRange<T>(
  supabase: SupabaseClient,
  table: string,
  dateColumn: string,
  from: string,
  to: string,
): Promise<T[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('user_id', user.id)
    .gte(dateColumn, from)
    .lte(dateColumn, to)
    .order(dateColumn, { ascending: true });

  if (error) {
    console.error(`fetchDateRange(${table}) error:`, error);
    return [];
  }
  return (data ?? []) as T[];
}
