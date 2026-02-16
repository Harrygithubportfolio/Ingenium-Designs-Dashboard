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

export default function WeatherLocationModal({ onClose }: { onClose: () => void }) {
  const { updateSection } = useSettings();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeoResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [geolocating, setGeolocating] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [tempUnit, setTempUnit] = useState<TemperatureUnit>('celsius');
  const [windUnit, setWindUnit] = useState<WindSpeedUnit>('kmh');
  const [selected, setSelected] = useState<GeoResult | null>(null);
  const [saving, setSaving] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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
        // Silently fail — user can retry
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleSelect = useCallback((result: GeoResult) => {
    setSelected(result);
    setQuery(`${result.name}${result.state ? `, ${result.state}` : ''}, ${result.country}`);
    setResults([]);
  }, []);

  const handleGeolocation = useCallback(async () => {
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

  const handleSave = useCallback(async () => {
    if (!selected) return;
    setSaving(true);
    await updateSection('weather', {
      location_name: `${selected.name}${selected.state ? `, ${selected.state}` : ''}, ${selected.country}`,
      latitude: String(selected.lat),
      longitude: String(selected.lon),
      temperature_unit: tempUnit,
      wind_speed_unit: windUnit,
    });
    setSaving(false);
    onClose();
  }, [selected, tempUnit, windUnit, updateSection, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-card rounded-2xl border border-edge shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 pb-3">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] flex items-center justify-center">
              <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-heading">Set Your Location</h2>
              <p className="text-xs text-sub">For personalised weather updates</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 pb-5 space-y-4">
          {/* City search */}
          <div className="relative">
            <label className="text-[11px] font-medium text-sub uppercase tracking-wider mb-1.5 block">
              Search city
            </label>
            <div className="relative">
              <input
                ref={inputRef}
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

          {geoError && (
            <p className="text-xs text-red-400">{geoError}</p>
          )}

          {/* Unit preferences */}
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
                      {u === 'celsius' ? '°C — Celsius' : '°F — Fahrenheit'}
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

          {/* Save button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={!selected || saving}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] text-white text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save location'}
          </button>
        </div>
      </div>
    </div>
  );
}
