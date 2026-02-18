import type { SupabaseClient } from '@supabase/supabase-js';

const FOCUS_STORAGE_KEY = 'lifeOS_dailyFocus';
const REFLECTION_STORAGE_KEY = 'lifeOS_reflections';

interface LegacyFocusTask {
  id: string;
  title: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  source?: 'goal' | 'manual';
  goalId?: string;
  milestoneId?: string;
}

interface LegacyDailyFocus {
  id: string;
  date: string;
  primaryFocus: string;
  primaryFocusCompleted: boolean;
  supportingTasks: LegacyFocusTask[];
  intentionNote?: string;
  createdAt: string;
}

interface LegacyReflection {
  id: string;
  date: string;
  wentWell: string;
  challenges: string;
  improvements: string;
  gratitude?: string;
  createdAt: string;
}

/**
 * One-time migration of daily focus and reflection data from localStorage to Supabase.
 * After successful migration, renames the localStorage keys so migration doesn't run again.
 */
export async function migrateLocalStorage(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  if (typeof window === 'undefined') return;

  const focusData = localStorage.getItem(FOCUS_STORAGE_KEY);
  const reflectionData = localStorage.getItem(REFLECTION_STORAGE_KEY);

  // Nothing to migrate
  if (!focusData && !reflectionData) return;

  try {
    // Migrate daily focus entries
    if (focusData) {
      const entries: LegacyDailyFocus[] = JSON.parse(focusData);
      if (entries.length > 0) {
        const rows = entries.map(entry => ({
          user_id: userId,
          focus_date: entry.date,
          primary_focus: entry.primaryFocus,
          primary_focus_completed: entry.primaryFocusCompleted,
          supporting_tasks: entry.supportingTasks,
          intention_note: entry.intentionNote || null,
          created_at: entry.createdAt,
        }));

        const { error } = await supabase
          .from('daily_focus')
          .upsert(rows, { onConflict: 'user_id,focus_date', ignoreDuplicates: true });

        if (error) {
          console.error('Failed to migrate daily focus data:', error);
          return; // Don't rename keys if migration failed
        }
      }

      localStorage.removeItem(FOCUS_STORAGE_KEY);
      localStorage.setItem(`${FOCUS_STORAGE_KEY}_migrated`, 'true');
    }

    // Migrate reflections
    if (reflectionData) {
      const entries: LegacyReflection[] = JSON.parse(reflectionData);
      if (entries.length > 0) {
        const rows = entries.map(entry => ({
          user_id: userId,
          reflect_date: entry.date,
          went_well: entry.wentWell,
          challenges: entry.challenges,
          improvements: entry.improvements,
          gratitude: entry.gratitude || null,
          created_at: entry.createdAt,
        }));

        const { error } = await supabase
          .from('reflections')
          .upsert(rows, { onConflict: 'user_id,reflect_date', ignoreDuplicates: true });

        if (error) {
          console.error('Failed to migrate reflections data:', error);
          return;
        }
      }

      localStorage.removeItem(REFLECTION_STORAGE_KEY);
      localStorage.setItem(`${REFLECTION_STORAGE_KEY}_migrated`, 'true');
    }
  } catch (err) {
    console.error('localStorage migration error:', err);
  }
}
