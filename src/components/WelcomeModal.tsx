'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSettings } from '@/store/useSettings';
import type { TemperatureUnit, WindSpeedUnit } from '@/lib/settings/types';

interface GeoResult {
  name: string;
  state?: string;
  country: string;
  lat: number;
  lon: number;
}

type Step = 'name' | 'weather';

export default function WelcomeModal({ onClose }: { onClose: () => void }) {
  const { updateSection } = useSettings();

  const [step, setStep] = useState<Step>('name');
  const [name, setName] = useState('');

  // Weather state
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeoResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [geolocating, setGeolocating] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [tempUnit, setTempUnit] = useState<TemperatureUnit>('celsius');
  const [windUnit, setWindUnit] = useState<WindSpeedUnit>('kmh');
  const [selected, setSelected] = useState<GeoResult | null>(null);
  const [saving, setSaving] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const cityInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Focus the correct input on step change
  useEffect(() => {
    if (step === 'name') {
      nameInputRef.current?.focus();
    } else {
      cityInputRef.current?.focus();
    }
  }, [step]);

  // Debounced city search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data: GeoResult[] = await res.json();
          setResults(data);
        }
      } catch {
        // Silently fail
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleNameContinue = useCallback(() => {
    if (!name.trim()) return;
    updateSection('profile', { display_name: name.trim() });
    setStep('weather');
  }, [name, updateSection]);

  const handleSelect = useCallback((result: GeoResult) => {
    setSelected(result);
    setQuery(`${result.name}${result.state ? `, ${result.state}` : ''}, ${result.country}`);
    setResults([]);
  }, []);

  const handleGeolocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }
    setGeolocating(true);
    setGeoError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(`/api/geocode?lat=${latitude}&lon=${longitude}`);
          if (res.ok) {
            const data: GeoResult[] = await res.json();
            if (data.length > 0) {
              const loc = data[0];
              setSelected(loc);
              setQuery(`${loc.name}${loc.state ? `, ${loc.state}` : ''}, ${loc.country}`);
              setResults([]);
            }
          }
        } catch {
          setGeoError('Failed to look up your location.');
        } finally {
          setGeolocating(false);
        }
      },
      (err) => {
        setGeolocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError('Location permission denied. Please allow access and try again.');
        } else {
          setGeoError('Unable to determine your location.');
        }
      },
      { enableHighAccuracy: false, timeout: 10000 },
    );
  }, []);

  const handleFinish = useCallback(async () => {
    setSaving(true);

    // Save weather if a location was selected
    if (selected) {
      await updateSection('weather', {
        location_name: `${selected.name}${selected.state ? `, ${selected.state}` : ''}, ${selected.country}`,
        latitude: String(selected.lat),
        longitude: String(selected.lon),
        temperature_unit: tempUnit,
        wind_speed_unit: windUnit,
      });
    }

    // Mark onboarding as completed
    await updateSection('profile', { onboarding_completed: true });

    setSaving(false);
    onClose();
  }, [selected, tempUnit, windUnit, updateSection, onClose]);

  const handleSkipWeather = useCallback(async () => {
    setSaving(true);
    await updateSection('profile', { onboarding_completed: true });
    setSaving(false);
    onClose();
  }, [updateSection, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-card rounded-2xl border border-edge shadow-2xl overflow-hidden">
        {/* Step indicator */}
        <div className="flex gap-2 px-5 pt-5">
          <div className={`h-1 flex-1 rounded-full transition-colors ${step === 'name' ? 'bg-accent' : 'bg-accent/40'}`} />
          <div className={`h-1 flex-1 rounded-full transition-colors ${step === 'weather' ? 'bg-accent' : 'bg-edge'}`} />
        </div>

        {step === 'name' ? (
          /* ─── STEP 1: NAME ─── */
          <div className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-secondary flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-heading">Welcome to Life OS</h2>
                <p className="text-xs text-sub">Let&apos;s personalise your experience</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-heading mb-2 block">
                  What do we call you?
                </label>
                <input
                  ref={nameInputRef}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleNameContinue();
                  }}
                  placeholder="Enter your name..."
                  className="w-full px-4 py-3 bg-inner rounded-xl border border-edge text-heading text-sm placeholder:text-dim/50 focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 transition-all"
                  autoComplete="given-name"
                />
              </div>

              <button
                type="button"
                onClick={handleNameContinue}
                disabled={!name.trim()}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-accent to-accent-secondary text-white text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        ) : (
          /* ─── STEP 2: WEATHER ─── */
          <div className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-semibold text-heading">Set Your Location</h2>
                <p className="text-xs text-sub">For personalised weather updates</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* City search */}
              <div className="relative">
                <label className="text-[11px] font-medium text-sub uppercase tracking-wider mb-1.5 block">
                  Search city
                </label>
                <div className="relative">
                  <input
                    ref={cityInputRef}
                    type="text"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setSelected(null);
                    }}
                    placeholder="e.g. London, Manchester, New York..."
                    className="w-full px-3 py-2.5 bg-inner rounded-xl border border-edge text-heading text-sm placeholder:text-dim/50 focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 transition-all"
                  />
                  {searching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                    </div>
                  )}
                </div>

                {/* Search results dropdown */}
                {results.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-elevated rounded-xl border border-edge shadow-xl z-10 overflow-hidden">
                    {results.map((r, i) => (
                      <button
                        key={`${r.lat}-${r.lon}-${i}`}
                        type="button"
                        onClick={() => handleSelect(r)}
                        className="w-full px-3 py-2.5 text-left hover:bg-accent/10 transition-colors flex items-center gap-2 border-b border-edge/50 last:border-0"
                      >
                        <svg className="w-3.5 h-3.5 text-sub flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        <div>
                          <span className="text-sm text-heading font-medium">{r.name}</span>
                          <span className="text-xs text-sub ml-1">
                            {r.state ? `${r.state}, ` : ''}{r.country}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Geolocation button */}
              <button
                type="button"
                onClick={handleGeolocation}
                disabled={geolocating}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-edge bg-inner hover:bg-elevated text-sm text-sub hover:text-heading transition-all disabled:opacity-50"
              >
                {geolocating ? (
                  <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06z" />
                  </svg>
                )}
                <span>{geolocating ? 'Detecting location...' : 'Use my current location'}</span>
              </button>

              {geoError && <p className="text-xs text-red-400">{geoError}</p>}

              {/* Unit preferences — only shown after selecting a location */}
              {selected && (
                <div className="space-y-3 pt-1">
                  <div className="h-px bg-edge" />

                  {/* Temperature unit */}
                  <div>
                    <label className="text-[11px] font-medium text-sub uppercase tracking-wider mb-1.5 block">
                      Temperature unit
                    </label>
                    <div className="flex gap-2">
                      {(['celsius', 'fahrenheit'] as const).map((u) => (
                        <button
                          key={u}
                          type="button"
                          onClick={() => setTempUnit(u)}
                          className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                            tempUnit === u
                              ? 'bg-accent/15 text-accent border border-accent/30'
                              : 'bg-inner border border-edge text-sub hover:text-heading hover:bg-elevated'
                          }`}
                        >
                          {u === 'celsius' ? '\u00B0C \u2014 Celsius' : '\u00B0F \u2014 Fahrenheit'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Wind speed unit */}
                  <div>
                    <label className="text-[11px] font-medium text-sub uppercase tracking-wider mb-1.5 block">
                      Wind speed unit
                    </label>
                    <div className="flex gap-2">
                      {([
                        { value: 'kmh' as const, label: 'km/h' },
                        { value: 'mph' as const, label: 'mph' },
                        { value: 'ms' as const, label: 'm/s' },
                      ]).map(({ value, label }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setWindUnit(value)}
                          className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                            windUnit === value
                              ? 'bg-accent/15 text-accent border border-accent/30'
                              : 'bg-inner border border-edge text-sub hover:text-heading hover:bg-elevated'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleSkipWeather}
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl border border-edge text-sub text-sm font-medium hover:bg-elevated transition-all disabled:opacity-40"
                >
                  Skip for now
                </button>
                <button
                  type="button"
                  onClick={handleFinish}
                  disabled={!selected || saving}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-accent to-accent-secondary text-white text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Finish setup'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
