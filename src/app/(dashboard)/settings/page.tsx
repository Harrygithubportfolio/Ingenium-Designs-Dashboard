'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useSettings } from '@/store/useSettings';
import { useCalendar } from '@/store/useCalendar';
import { createClient } from '@/lib/supabase/client';
import {
  type SettingsSection,
  type AccentColour,
  type ThemeMode,
  type WeightUnit,
  type TemperatureUnit,
  type WindSpeedUnit,
  type MeasurementSystem,
  SETTINGS_SECTIONS,
  ACCENT_COLOUR_LABELS,
  DEFAULT_SETTINGS,
  applyAccentColour,
  applyTheme,
} from '@/lib/settings/types';
import type { TrainingIntent } from '@/lib/fitness/types';
import { TRAINING_INTENT_LABELS, TRAINING_INTENT_COLORS } from '@/lib/fitness/types';
import { MEAL_TYPE_LABELS } from '@/lib/nutrition/types';
import type { MealType } from '@/lib/nutrition/types';
import type { AiProviderName } from '@/lib/ai/types';

// ============================================
// REUSABLE UI PRIMITIVES
// ============================================

function ComingSoonBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/20">
      Coming soon
    </span>
  );
}

function SettingsToggle({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked ? 'true' : 'false'}
      aria-label="Toggle setting"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      } ${checked ? 'bg-accent' : 'bg-elevated border border-edge'}`}
    >
      <span
        className={`inline-block h-4.5 w-4.5 rounded-full bg-white transition-transform ${
          checked ? 'translate-x-5.5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex bg-inner rounded-lg p-1 border border-edge">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
            value === opt.value
              ? 'bg-accent text-white'
              : 'text-sub hover:text-heading'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function SettingsInput({
  value,
  onChange,
  placeholder,
  readOnly = false,
  type = 'text',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      readOnly={readOnly}
      className={`w-full bg-inner border border-edge rounded-xl px-4 py-2.5 text-sm text-heading placeholder:text-dim transition-colors focus:border-accent/50 focus:ring-1 focus:ring-accent/20 focus:outline-none ${
        readOnly ? 'opacity-60 cursor-not-allowed' : ''
      }`}
    />
  );
}

function SettingsSelect<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      aria-label="Select option"
      className="w-full bg-inner border border-edge rounded-xl px-4 py-2.5 text-sm text-heading transition-colors focus:border-accent/50 focus:ring-1 focus:ring-accent/20 focus:outline-none appearance-none cursor-pointer"
      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}

function NumberStepper({
  value,
  onChange,
  min,
  max,
  step,
  suffix,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  suffix?: string;
}) {
  return (
    <div className="inline-flex items-center gap-3 bg-inner rounded-xl border border-edge px-3 py-2">
      <button
        type="button"
        aria-label="Decrease"
        onClick={() => onChange(Math.max(min, value - step))}
        disabled={value <= min}
        className="w-7 h-7 rounded-lg bg-elevated text-sub hover:text-heading hover:bg-edge flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
        </svg>
      </button>
      <span className="text-sm font-medium text-heading min-w-[4rem] text-center">
        {value}{suffix}
      </span>
      <button
        type="button"
        aria-label="Increase"
        onClick={() => onChange(Math.min(max, value + step))}
        disabled={value >= max}
        className="w-7 h-7 rounded-lg bg-elevated text-sub hover:text-heading hover:bg-edge flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
}

function SectionCard({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card rounded-2xl border border-edge p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent to-accent-secondary flex items-center justify-center text-white flex-shrink-0">
          {icon}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-heading">{title}</h2>
          <p className="text-xs text-dim">{description}</p>
        </div>
      </div>
      <div className="space-y-5">{children}</div>
    </div>
  );
}

function SettingsRow({
  label,
  description,
  badge,
  children,
}: {
  label: string;
  description?: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-heading">{label}</p>
          {badge}
        </div>
        {description && (
          <p className="text-xs text-dim mt-0.5">{description}</p>
        )}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

// ============================================
// SECTION ICONS (inline SVGs)
// ============================================

const SectionIcons: Record<SettingsSection, React.ReactNode> = {
  profile: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  appearance: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
  ),
  fitness: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12h1m16 0h1M5.6 5.6l.7.7m12.1-.7l-.7.7M8 12a4 4 0 108 0M12 4V3" />
    </svg>
  ),
  nutrition: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  ),
  weather: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
    </svg>
  ),
  calendar: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  focus: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  notifications: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
  integrations: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  ),
  'data-privacy': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  account: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  ),
};

// ============================================
// SECTION COMPONENTS
// ============================================

function ProfileSection() {
  const { settings, updateSection } = useSettings();
  const [email, setEmail] = useState('');
  const [localName, setLocalName] = useState(settings.profile.display_name);

  useEffect(() => {
    setLocalName(settings.profile.display_name);
  }, [settings.profile.display_name]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setEmail(user.email);
    });
  }, []);

  const initial = localName?.[0]?.toUpperCase() || email?.[0]?.toUpperCase() || 'U';

  return (
    <SectionCard title="Profile" description="Display name and avatar" icon={SectionIcons.profile}>
      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-heading">{localName || 'No name set'}</p>
          <p className="text-xs text-dim">{email}</p>
        </div>
      </div>

      <SettingsRow label="Display Name" description="How you appear across the dashboard">
        <div className="w-56">
          <SettingsInput
            value={localName}
            onChange={setLocalName}
            placeholder="Enter your name"
          />
        </div>
      </SettingsRow>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => updateSection('profile', { display_name: localName })}
          className="px-4 py-2 text-xs font-medium rounded-lg bg-accent text-white hover:bg-accent-hover transition-colors"
        >
          Save Name
        </button>
      </div>

      <SettingsRow label="Email" description="Managed through your authentication provider">
        <div className="w-56">
          <SettingsInput value={email} onChange={() => {}} readOnly />
        </div>
      </SettingsRow>
    </SectionCard>
  );
}

function AppearanceSection() {
  const { settings, updateSection } = useSettings();

  // Local state for live preview — not persisted until Save
  const [localTheme, setLocalTheme] = useState<ThemeMode>(settings.appearance.theme);
  const [localAccent, setLocalAccent] = useState<AccentColour>(settings.appearance.accent_colour);
  const [hasChanges, setHasChanges] = useState(false);

  // Sync local state when saved settings change (e.g. after fetch)
  useEffect(() => {
    setLocalTheme(settings.appearance.theme);
    setLocalAccent(settings.appearance.accent_colour);
    setHasChanges(false);
  }, [settings.appearance.theme, settings.appearance.accent_colour]);

  // Live preview — apply accent + theme to CSS vars immediately on selection
  useEffect(() => {
    applyAccentColour(localAccent);
  }, [localAccent]);

  useEffect(() => {
    applyTheme(localTheme);
  }, [localTheme]);

  const handleAccentChange = (hex: AccentColour) => {
    setLocalAccent(hex);
    setHasChanges(hex !== settings.appearance.accent_colour || localTheme !== settings.appearance.theme);
  };

  const handleThemeChange = (theme: ThemeMode) => {
    setLocalTheme(theme);
    setHasChanges(theme !== settings.appearance.theme || localAccent !== settings.appearance.accent_colour);
  };

  const handleSave = () => {
    updateSection('appearance', { theme: localTheme, accent_colour: localAccent });
    setHasChanges(false);
  };

  const handleCancel = () => {
    setLocalTheme(settings.appearance.theme);
    setLocalAccent(settings.appearance.accent_colour);
    applyAccentColour(settings.appearance.accent_colour);
    applyTheme(settings.appearance.theme);
    setHasChanges(false);
  };

  const themes: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { value: 'dark', label: 'Dark', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
    )},
    { value: 'light', label: 'Light', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    )},
    { value: 'system', label: 'System', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    )},
  ];

  const accentColours = Object.entries(ACCENT_COLOUR_LABELS) as [AccentColour, string][];

  return (
    <SectionCard title="Appearance" description="Theme and accent colour" icon={SectionIcons.appearance}>
      {/* Theme selector */}
      <div>
        <p className="text-sm font-medium text-heading mb-3">Theme</p>
        <div className="grid grid-cols-3 gap-3">
          {themes.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => handleThemeChange(t.value)}
              className={`relative p-4 rounded-xl border text-center transition-all cursor-pointer ${
                localTheme === t.value
                  ? 'border-[var(--accent)] bg-[var(--accent-subtle)]'
                  : 'border-edge bg-inner hover:border-[var(--accent)]/30'
              }`}
            >
              {/* Theme preview */}
              <div className={`w-full h-12 rounded-lg mb-2 flex items-center justify-center ${
                t.value === 'dark' ? 'bg-[#0f0f14] border border-[#2a2a33]'
                : t.value === 'light' ? 'bg-[#f8fafc] border border-[#cbd5e1]'
                : 'bg-gradient-to-r from-[#0f0f14] to-[#f8fafc] border border-[#2a2a33]'
              }`}>
                <span className={`${
                  t.value === 'dark' ? 'text-[#9ca3af]'
                  : t.value === 'light' ? 'text-[#475569]'
                  : 'text-[#9ca3af]'
                }`}>
                  {t.icon}
                </span>
              </div>
              <p className="text-xs font-medium text-heading">{t.label}</p>
              {localTheme === t.value && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Accent colour picker */}
      <div>
        <p className="text-sm font-medium text-heading mb-3">Accent Colour</p>
        <p className="text-xs text-dim mb-4">Choose a colour that defines the look of your dashboard. Changes are previewed live.</p>
        <div className="flex flex-wrap gap-3">
          {accentColours.map(([hex, label]) => (
            <button
              key={hex}
              type="button"
              onClick={() => handleAccentChange(hex)}
              className="group flex flex-col items-center gap-1.5"
              title={label}
            >
              <div
                className={`w-10 h-10 rounded-full transition-all ${
                  localAccent === hex ? '' : 'hover:scale-110'
                }`}
                style={{
                  backgroundColor: hex,
                  boxShadow: localAccent === hex ? `0 0 0 2px var(--bg-card), 0 0 0 4px ${hex}` : undefined,
                }}
              />
              <span className={`text-[10px] transition-colors ${
                localAccent === hex ? 'text-heading font-medium' : 'text-dim group-hover:text-sub'
              }`}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Save / Cancel buttons */}
      <div className={`flex items-center justify-between pt-4 border-t border-edge transition-opacity ${hasChanges ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
        <p className="text-xs text-dim">
          {hasChanges ? 'You have unsaved changes' : 'No changes'}
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleCancel}
            disabled={!hasChanges}
            className="px-4 py-2 text-xs font-medium rounded-lg border border-edge text-sub hover:text-heading hover:bg-elevated transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!hasChanges}
            className="px-4 py-2 text-xs font-medium rounded-lg text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            Save
          </button>
        </div>
      </div>
    </SectionCard>
  );
}

function FitnessSection() {
  const { settings, updateSection } = useSettings();
  const { fitness } = settings;

  const intents = Object.entries(TRAINING_INTENT_LABELS) as [TrainingIntent, string][];

  return (
    <SectionCard title="Fitness & Gym" description="Weight units, rest timer, training defaults" icon={SectionIcons.fitness}>
      <SettingsRow label="Weight Unit" description="Used for logging sets in gym mode">
        <SegmentedControl
          options={[
            { value: 'kg' as WeightUnit, label: 'kg' },
            { value: 'lbs' as WeightUnit, label: 'lbs' },
          ]}
          value={fitness.default_weight_unit}
          onChange={(v) => updateSection('fitness', { default_weight_unit: v })}
        />
      </SettingsRow>

      <SettingsRow label="Default Rest Timer" description="Seconds between sets in gym mode">
        <NumberStepper
          value={fitness.default_rest_timer_seconds}
          onChange={(v) => updateSection('fitness', { default_rest_timer_seconds: v })}
          min={15}
          max={300}
          step={15}
          suffix="s"
        />
      </SettingsRow>

      <SettingsRow label="Auto-advance Exercise" description="Automatically move to next exercise after completing all sets">
        <SettingsToggle
          checked={fitness.auto_advance_exercise}
          onChange={(v) => updateSection('fitness', { auto_advance_exercise: v })}
        />
      </SettingsRow>

      <div>
        <p className="text-sm font-medium text-heading mb-2">Default Training Intent</p>
        <p className="text-xs text-dim mb-3">Applied to new workout templates</p>
        <div className="flex flex-wrap gap-2">
          {intents.map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => updateSection('fitness', { default_training_intent: value })}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all border ${
                fitness.default_training_intent === value
                  ? `${TRAINING_INTENT_COLORS[value]} border-current`
                  : 'text-sub bg-inner border-edge hover:text-heading'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

function NutritionSection() {
  const { settings, updateSection } = useSettings();
  const { nutrition } = settings;

  const mealOptions = Object.entries(MEAL_TYPE_LABELS).map(([value, label]) => ({
    value: value as MealType,
    label,
  }));

  return (
    <SectionCard title="Nutrition" description="Meal types, AI provider, units" icon={SectionIcons.nutrition}>
      <SettingsRow label="Default Meal Type" description="Pre-selected when logging a new meal">
        <div className="w-48">
          <SettingsSelect
            options={mealOptions}
            value={nutrition.default_meal_type}
            onChange={(v) => updateSection('nutrition', { default_meal_type: v })}
          />
        </div>
      </SettingsRow>

      {/* AI Provider */}
      <div>
        <p className="text-sm font-medium text-heading mb-2">Preferred AI Provider</p>
        <p className="text-xs text-dim mb-3">Used for AI meal estimation and insights</p>
        <div className="grid grid-cols-2 gap-3">
          {(['anthropic', 'gemini'] as AiProviderName[]).map((provider) => (
            <button
              key={provider}
              type="button"
              onClick={() => updateSection('nutrition', { preferred_ai_provider: provider })}
              className={`p-4 rounded-xl border text-left transition-all ${
                nutrition.preferred_ai_provider === provider
                  ? 'border-accent bg-accent/10'
                  : 'border-edge bg-inner hover:border-accent/30'
              }`}
            >
              <p className="text-sm font-medium text-heading capitalize">{provider}</p>
              <p className="text-[10px] text-dim mt-1">
                {provider === 'anthropic' ? 'Claude — Anthropic' : 'Gemini — Google'}
              </p>
            </button>
          ))}
        </div>
      </div>

      <SettingsRow label="Measurement System" description="Portion sizes and nutritional display">
        <SegmentedControl
          options={[
            { value: 'metric' as MeasurementSystem, label: 'Metric' },
            { value: 'imperial' as MeasurementSystem, label: 'Imperial' },
          ]}
          value={nutrition.measurement_system}
          onChange={(v) => updateSection('nutrition', { measurement_system: v })}
        />
      </SettingsRow>
    </SectionCard>
  );
}

function WeatherSection() {
  const { settings, updateSection } = useSettings();
  const { weather } = settings;
  const [localLocation, setLocalLocation] = useState(weather.location_name);
  const [localLat, setLocalLat] = useState(weather.latitude);
  const [localLon, setLocalLon] = useState(weather.longitude);
  const [showCoords, setShowCoords] = useState(false);

  useEffect(() => {
    setLocalLocation(weather.location_name);
    setLocalLat(weather.latitude);
    setLocalLon(weather.longitude);
  }, [weather.location_name, weather.latitude, weather.longitude]);

  const saveLocation = useCallback(() => {
    updateSection('weather', {
      location_name: localLocation,
      latitude: localLat,
      longitude: localLon,
    });
  }, [localLocation, localLat, localLon, updateSection]);

  return (
    <SectionCard title="Weather" description="Location and temperature units" icon={SectionIcons.weather}>
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-heading">Location</p>
          <button
            type="button"
            onClick={() => setShowCoords(!showCoords)}
            className="text-[10px] text-accent hover:text-accent transition-colors"
          >
            {showCoords ? 'Hide coordinates' : 'Edit coordinates'}
          </button>
        </div>
        <SettingsInput
          value={localLocation}
          onChange={setLocalLocation}
          placeholder="City, Country"
        />
        {showCoords && (
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <label className="text-[10px] text-dim uppercase tracking-wider mb-1 block">Latitude</label>
              <SettingsInput value={localLat} onChange={setLocalLat} placeholder="53.9921" />
            </div>
            <div>
              <label className="text-[10px] text-dim uppercase tracking-wider mb-1 block">Longitude</label>
              <SettingsInput value={localLon} onChange={setLocalLon} placeholder="-1.5418" />
            </div>
          </div>
        )}
        <div className="flex justify-end mt-3">
          <button
            type="button"
            onClick={saveLocation}
            className="px-4 py-2 text-xs font-medium rounded-lg bg-accent text-white hover:bg-accent-hover transition-colors"
          >
            Save Location
          </button>
        </div>
      </div>

      <SettingsRow label="Temperature Unit">
        <SegmentedControl
          options={[
            { value: 'celsius' as TemperatureUnit, label: '\u00B0C' },
            { value: 'fahrenheit' as TemperatureUnit, label: '\u00B0F' },
          ]}
          value={weather.temperature_unit}
          onChange={(v) => updateSection('weather', { temperature_unit: v })}
        />
      </SettingsRow>

      <SettingsRow label="Wind Speed Unit">
        <SegmentedControl
          options={[
            { value: 'kmh' as WindSpeedUnit, label: 'km/h' },
            { value: 'mph' as WindSpeedUnit, label: 'mph' },
            { value: 'ms' as WindSpeedUnit, label: 'm/s' },
          ]}
          value={weather.wind_speed_unit}
          onChange={(v) => updateSection('weather', { wind_speed_unit: v })}
        />
      </SettingsRow>
    </SectionCard>
  );
}

function CalendarSection() {
  const { settings, updateSection } = useSettings();
  const { calendar: calSettings } = settings;
  const { connection, fetchConnection } = useCalendar();

  useEffect(() => {
    fetchConnection();
  }, [fetchConnection]);

  const isConnected = !!connection;

  return (
    <SectionCard title="Calendar" description="Sync and event defaults" icon={SectionIcons.calendar}>
      {/* Google Calendar connection */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-inner border border-edge">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-400' : 'bg-gray-500'}`} />
          <div>
            <p className="text-sm font-medium text-heading">Google Calendar</p>
            <p className="text-xs text-dim">
              {isConnected ? 'Connected and syncing' : 'Not connected'}
            </p>
          </div>
        </div>
        {!isConnected && (
          <a
            href="/api/calendar/google/auth"
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-accent text-white hover:bg-accent-hover transition-colors"
          >
            Connect
          </a>
        )}
      </div>

      <SettingsRow label="Sync Frequency" description="How often to sync with Google Calendar">
        <div className="w-40">
          <SettingsSelect
            options={[
              { value: '15', label: 'Every 15 min' },
              { value: '30', label: 'Every 30 min' },
              { value: '60', label: 'Every hour' },
              { value: '120', label: 'Every 2 hours' },
            ]}
            value={String(calSettings.sync_frequency_minutes)}
            onChange={(v) => updateSection('calendar', { sync_frequency_minutes: Number(v) })}
          />
        </div>
      </SettingsRow>

      <SettingsRow label="Default Event Duration" description="Pre-filled when creating new events">
        <div className="w-40">
          <SettingsSelect
            options={[
              { value: '15', label: '15 minutes' },
              { value: '30', label: '30 minutes' },
              { value: '45', label: '45 minutes' },
              { value: '60', label: '1 hour' },
              { value: '90', label: '1.5 hours' },
              { value: '120', label: '2 hours' },
            ]}
            value={String(calSettings.default_event_duration_minutes)}
            onChange={(v) => updateSection('calendar', { default_event_duration_minutes: Number(v) })}
          />
        </div>
      </SettingsRow>
    </SectionCard>
  );
}

function FocusSection() {
  const { settings, updateSection } = useSettings();
  const { focus } = settings;

  const hourOptions = Array.from({ length: 24 }, (_, i) => ({
    value: String(i),
    label: `${String(i).padStart(2, '0')}:00`,
  }));

  return (
    <SectionCard title="Focus" description="Morning and evening session times" icon={SectionIcons.focus}>
      <SettingsRow label="Morning Session Starts" description="When the morning focus mode becomes available">
        <div className="w-32">
          <SettingsSelect
            options={hourOptions}
            value={String(focus.morning_start_hour)}
            onChange={(v) => updateSection('focus', { morning_start_hour: Number(v) })}
          />
        </div>
      </SettingsRow>

      <SettingsRow label="Evening Session Starts" description="When the evening review mode becomes available">
        <div className="w-32">
          <SettingsSelect
            options={hourOptions}
            value={String(focus.evening_start_hour)}
            onChange={(v) => updateSection('focus', { evening_start_hour: Number(v) })}
          />
        </div>
      </SettingsRow>
    </SectionCard>
  );
}

function NotificationsSection() {
  const { settings, updateSection } = useSettings();
  const { notifications } = settings;

  const items: { key: keyof typeof notifications; label: string; description: string }[] = [
    { key: 'workout_reminders', label: 'Workout Reminders', description: 'Get reminded about scheduled workouts' },
    { key: 'meal_logging_reminders', label: 'Meal Logging Reminders', description: 'Reminders to log your meals' },
    { key: 'goal_deadlines', label: 'Goal Deadlines', description: 'Notifications when goal deadlines approach' },
    { key: 'daily_focus_prompts', label: 'Daily Focus Prompts', description: 'Morning and evening focus session prompts' },
  ];

  return (
    <SectionCard title="Notifications" description="Reminders and prompts" icon={SectionIcons.notifications}>
      {items.map((item) => (
        <SettingsRow
          key={item.key}
          label={item.label}
          description={item.description}
          badge={<ComingSoonBadge />}
        >
          <SettingsToggle
            checked={notifications[item.key]}
            onChange={(v) => updateSection('notifications', { [item.key]: v })}
          />
        </SettingsRow>
      ))}
      <p className="text-[10px] text-dim mt-2">
        Notification infrastructure is under development. Your preferences will be saved and applied once available.
      </p>
    </SectionCard>
  );
}

function IntegrationsSection() {
  const { connection, disconnectGoogle, fetchConnection } = useCalendar();

  useEffect(() => {
    fetchConnection();
  }, [fetchConnection]);

  const isGoogleConnected = !!connection;

  const futureIntegrations = [
    { name: 'Spotify', description: 'Workout playlists and listening stats', icon: '🎵' },
    { name: 'Apple Health', description: 'Sync health and activity data', icon: '❤️' },
    { name: 'Notion', description: 'Sync notes and knowledge base', icon: '📝' },
    { name: 'Strava', description: 'Running and cycling activities', icon: '🏃' },
  ];

  return (
    <SectionCard title="Integrations" description="Connected services" icon={SectionIcons.integrations}>
      {/* Google Calendar */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-inner border border-edge">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-elevated flex items-center justify-center text-lg">
            📅
          </div>
          <div>
            <p className="text-sm font-medium text-heading">Google Calendar</p>
            <p className="text-xs text-dim">
              {isGoogleConnected ? 'Connected' : 'Not connected'}
            </p>
          </div>
        </div>
        {isGoogleConnected ? (
          <button
            type="button"
            onClick={disconnectGoogle}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-red-400/30 text-red-400 hover:bg-red-400/10 transition-colors"
          >
            Disconnect
          </button>
        ) : (
          <a
            href="/api/calendar/google/auth"
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-accent text-white hover:bg-accent-hover transition-colors"
          >
            Connect
          </a>
        )}
      </div>

      {/* Future integrations */}
      {futureIntegrations.map((integration) => (
        <div key={integration.name} className="flex items-center justify-between p-4 rounded-xl bg-inner border border-edge/50 opacity-60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-elevated flex items-center justify-center text-lg">
              {integration.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-heading">{integration.name}</p>
                <ComingSoonBadge />
              </div>
              <p className="text-xs text-dim">{integration.description}</p>
            </div>
          </div>
        </div>
      ))}
    </SectionCard>
  );
}

function DataPrivacySection() {
  const [clearing, setClearing] = useState(false);

  const handleClearLocalData = () => {
    if (confirm('This will clear all locally stored data (focus sessions, cached preferences). Your Supabase data will not be affected. Continue?')) {
      setClearing(true);
      localStorage.clear();
      setTimeout(() => {
        setClearing(false);
        alert('Local data cleared successfully.');
      }, 500);
    }
  };

  return (
    <SectionCard title="Data & Privacy" description="Export, clear data, policies" icon={SectionIcons['data-privacy']}>
      <SettingsRow label="Export Data" description="Download all your data as JSON">
        <button
          type="button"
          onClick={() => alert('Data export is coming soon. Your data is stored securely in Supabase.')}
          className="px-4 py-2 text-xs font-medium rounded-lg border border-edge text-sub hover:text-heading hover:bg-elevated transition-colors"
        >
          Export
        </button>
      </SettingsRow>

      <SettingsRow label="Clear Local Data" description="Remove cached data from this browser">
        <button
          type="button"
          onClick={handleClearLocalData}
          disabled={clearing}
          className="px-4 py-2 text-xs font-medium rounded-lg border border-amber-400/30 text-amber-400 hover:bg-amber-400/10 transition-colors disabled:opacity-50"
        >
          {clearing ? 'Clearing...' : 'Clear'}
        </button>
      </SettingsRow>

      <div className="pt-2 border-t border-edge">
        <p className="text-xs text-dim mb-3">Legal</p>
        <div className="flex gap-4">
          <a href="/privacy" target="_blank" rel="noopener" className="text-xs text-accent hover:text-accent transition-colors">
            Privacy Policy
          </a>
          <a href="/terms" target="_blank" rel="noopener" className="text-xs text-accent hover:text-accent transition-colors">
            Terms &amp; Conditions
          </a>
        </div>
      </div>
    </SectionCard>
  );
}

function AccountSection() {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <SectionCard title="Account" description="Sign out and account management" icon={SectionIcons.account}>
      <SettingsRow label="Sign Out" description="Sign out of your account on this device">
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className="px-4 py-2 text-xs font-medium rounded-lg border border-edge text-sub hover:text-heading hover:bg-elevated transition-colors disabled:opacity-50"
        >
          {signingOut ? 'Signing out...' : 'Sign Out'}
        </button>
      </SettingsRow>

      {/* Danger zone */}
      <div className="mt-4 p-4 rounded-xl border border-red-400/20 bg-red-400/5">
        <p className="text-sm font-medium text-red-400 mb-1">Danger Zone</p>
        <p className="text-xs text-dim mb-4">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled
            className="px-4 py-2 text-xs font-medium rounded-lg border border-red-400/30 text-red-400 opacity-50 cursor-not-allowed"
          >
            Delete Account
          </button>
          <ComingSoonBadge />
        </div>
      </div>
    </SectionCard>
  );
}

// ============================================
// NAVIGATION COMPONENT
// ============================================

function SettingsNav({
  active,
  onChange,
  layout,
}: {
  active: SettingsSection;
  onChange: (s: SettingsSection) => void;
  layout: 'vertical' | 'horizontal';
}) {
  if (layout === 'horizontal') {
    return (
      <div className="flex gap-1.5 pb-1">
        {SETTINGS_SECTIONS.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => onChange(section.id)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              active === section.id
                ? 'bg-accent/10 text-accent border border-accent/30'
                : 'text-sub hover:text-heading bg-card border border-edge'
            }`}
          >
            {section.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {SETTINGS_SECTIONS.map((section) => (
        <button
          key={section.id}
          type="button"
          onClick={() => onChange(section.id)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${
            active === section.id
              ? 'text-accent bg-accent/10'
              : 'text-sub hover:text-heading hover:bg-elevated'
          }`}
        >
          <span className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors flex-shrink-0 ${
            active === section.id ? 'bg-accent text-white' : 'bg-elevated'
          }`}>
            {SectionIcons[section.id]}
          </span>
          <span className="truncate">{section.label}</span>
          {active === section.id && (
            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
          )}
        </button>
      ))}
    </div>
  );
}

// ============================================
// LOADING SKELETON
// ============================================

function SettingsSkeleton() {
  return (
    <div className="h-full flex flex-col overflow-hidden animate-pulse">
      <div className="flex-shrink-0 mb-4">
        <div className="h-8 w-40 bg-card rounded-lg" />
      </div>
      <div className="flex-1 min-h-0 flex gap-4">
        <div className="hidden md:block w-56 space-y-2">
          {Array.from({ length: 11 }).map((_, i) => (
            <div key={i} className="h-10 bg-card rounded-lg" />
          ))}
        </div>
        <div className="flex-1 space-y-4">
          <div className="h-64 bg-card rounded-2xl" />
          <div className="h-48 bg-card rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN SETTINGS PAGE
// ============================================

const SECTION_COMPONENTS: Record<SettingsSection, React.ComponentType> = {
  profile: ProfileSection,
  appearance: AppearanceSection,
  fitness: FitnessSection,
  nutrition: NutritionSection,
  weather: WeatherSection,
  calendar: CalendarSection,
  focus: FocusSection,
  notifications: NotificationsSection,
  integrations: IntegrationsSection,
  'data-privacy': DataPrivacySection,
  account: AccountSection,
};

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');
  const { loading, saving, lastSaved, fetchSettings } = useSettings();

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const [showSaved, setShowSaved] = useState(false);
  useEffect(() => {
    if (lastSaved) {
      setShowSaved(true);
      const t = setTimeout(() => setShowSaved(false), 2000);
      return () => clearTimeout(t);
    }
  }, [lastSaved]);

  if (loading) return <SettingsSkeleton />;

  const ActiveComponent = SECTION_COMPONENTS[activeSection];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent/20 to-accent-secondary/20 flex items-center justify-center border border-accent/30">
            <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-heading">Settings</h1>
            <p className="text-xs text-dim">Manage your dashboard preferences</p>
          </div>
        </div>

        {/* Save indicator */}
        <AnimatePresence>
          {(saving || showSaved) && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                  <span className="text-xs text-sub">Saving...</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-xs text-green-400">Saved</span>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Mobile: horizontal nav */}
      <div className="md:hidden flex-shrink-0 mb-4 overflow-x-auto">
        <SettingsNav active={activeSection} onChange={setActiveSection} layout="horizontal" />
      </div>

      {/* Main content */}
      <div className="flex-1 min-h-0 flex gap-4 overflow-hidden">
        {/* Desktop: left nav */}
        <div className="hidden md:block w-56 flex-shrink-0 overflow-y-auto pr-1">
          <SettingsNav active={activeSection} onChange={setActiveSection} layout="vertical" />
        </div>

        {/* Right content area */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              <ActiveComponent />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
