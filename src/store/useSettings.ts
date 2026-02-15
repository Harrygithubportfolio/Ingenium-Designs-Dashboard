import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import { type UserSettings, DEFAULT_SETTINGS } from '@/lib/settings/types';

// Deep-merge defaults with stored settings so new fields always have values
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function deepMerge(defaults: any, overrides: any): any {
  if (!overrides) return defaults;
  const result = { ...defaults };
  for (const key in defaults) {
    const ov = overrides[key];
    if (ov === undefined) continue;
    if (
      ov !== null &&
      typeof ov === 'object' &&
      !Array.isArray(ov) &&
      typeof defaults[key] === 'object' &&
      defaults[key] !== null &&
      !Array.isArray(defaults[key])
    ) {
      result[key] = deepMerge(defaults[key], ov);
    } else {
      result[key] = ov;
    }
  }
  return result;
}

interface SettingsState {
  settings: UserSettings;
  loading: boolean;
  saving: boolean;
  lastSaved: string | null;

  fetchSettings: () => Promise<void>;
  updateSection: <K extends keyof UserSettings>(
    section: K,
    values: Partial<UserSettings[K]>,
  ) => Promise<void>;
}

export const useSettings = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  loading: false,
  saving: false,
  lastSaved: null,

  fetchSettings: async () => {
    set({ loading: true });
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { set({ loading: false }); return; }

      const { data, error } = await supabase
        .from('user_settings')
        .select('settings')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('fetchSettings error:', error);
      }

      if (data?.settings) {
        const merged = deepMerge(DEFAULT_SETTINGS, data.settings) as UserSettings;
        set({ settings: merged });
      }
    } catch (err) {
      console.error('fetchSettings error:', err);
    } finally {
      set({ loading: false });
    }
  },

  updateSection: async (section, values) => {
    const prev = get().settings;
    const updatedSection = { ...prev[section], ...values };
    const updated = { ...prev, [section]: updatedSection };

    // Optimistic update
    set({ settings: updated, saving: true });

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_settings')
        .upsert(
          { user_id: user.id, settings: updated },
          { onConflict: 'user_id' },
        );

      if (error) {
        console.error('updateSection error:', error);
        set({ settings: prev }); // rollback
      } else {
        set({ lastSaved: new Date().toISOString() });
      }
    } catch (err) {
      console.error('updateSection error:', err);
      set({ settings: prev });
    } finally {
      set({ saving: false });
    }
  },
}));
