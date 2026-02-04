'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  type WeatherData,
  type WeatherIconType,
  formatHour,
  formatTime,
  mapWeatherToIcon,
  capitalizeDescription,
  isDaytime,
  msToKmh,
  formatVisibility,
  getWindDirection,
} from '@/lib/weather';

// ============================================
// WEATHER ICON COMPONENT
// ============================================

function WeatherIcon({
  type,
  size = 'md',
  className = '',
}: {
  type: WeatherIconType;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}) {
  const sizeMap = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
    '2xl': 'w-24 h-24',
  };

  const iconSize = sizeMap[size];

  const icons: Record<WeatherIconType, React.ReactNode> = {
    'clear-day': (
      <svg className={`${iconSize} ${className}`} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="4" fill="#FBBF24" />
        <g stroke="#FBBF24" strokeWidth="2" strokeLinecap="round">
          <path d="M12 2v2" /><path d="M12 20v2" />
          <path d="M4.93 4.93l1.41 1.41" /><path d="M17.66 17.66l1.41 1.41" />
          <path d="M2 12h2" /><path d="M20 12h2" />
          <path d="M6.34 17.66l-1.41 1.41" /><path d="M19.07 4.93l-1.41 1.41" />
        </g>
      </svg>
    ),
    'clear-night': (
      <svg className={`${iconSize} ${className}`} viewBox="0 0 24 24" fill="none">
        <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" fill="#93C5FD" stroke="#60A5FA" strokeWidth="1.5" />
      </svg>
    ),
    'partly-cloudy-day': (
      <svg className={`${iconSize} ${className}`} viewBox="0 0 24 24" fill="none">
        <circle cx="9" cy="7" r="3" fill="#FBBF24" />
        <g stroke="#FBBF24" strokeWidth="1.5" strokeLinecap="round">
          <path d="M9 2v1" /><path d="M9 11v1" /><path d="M4 7H3" /><path d="M14 7h1" />
          <path d="M5.5 3.5l.7.7" /><path d="M12.5 10.5l.7.7" /><path d="M5.5 10.5l-.7.7" /><path d="M12.5 3.5l.7-.7" />
        </g>
        <path d="M19 18H9a4 4 0 110-8h.5a5 5 0 019.5 3 3 3 0 010 5z" fill="#E5E7EB" stroke="#D1D5DB" strokeWidth="1" />
      </svg>
    ),
    'partly-cloudy-night': (
      <svg className={`${iconSize} ${className}`} viewBox="0 0 24 24" fill="none">
        <path d="M13 4a5 5 0 015 5 3 3 0 01-5-5z" fill="#93C5FD" />
        <path d="M19 18H9a4 4 0 110-8h.5a5 5 0 019.5 3 3 3 0 010 5z" fill="#94A3B8" stroke="#64748B" strokeWidth="1" />
      </svg>
    ),
    cloudy: (
      <svg className={`${iconSize} ${className}`} viewBox="0 0 24 24" fill="none">
        <path d="M18 18H6a5 5 0 01-.5-9.98 7 7 0 0113.5 2.98A4 4 0 0118 18z" fill="#94A3B8" stroke="#64748B" strokeWidth="1" />
      </svg>
    ),
    overcast: (
      <svg className={`${iconSize} ${className}`} viewBox="0 0 24 24" fill="none">
        <path d="M20 16H8a4 4 0 110-8h.5A5 5 0 0118 11a3 3 0 012 5z" fill="#64748B" stroke="#475569" strokeWidth="1" />
        <path d="M16 20H6a3 3 0 110-6h.5a4 4 0 017.5 2 2 2 0 012 4z" fill="#94A3B8" stroke="#64748B" strokeWidth="1" />
      </svg>
    ),
    'rain-light': (
      <svg className={`${iconSize} ${className}`} viewBox="0 0 24 24" fill="none">
        <path d="M16 12H8a3 3 0 110-6h.5A4 4 0 0116 9a2 2 0 010 3z" fill="#94A3B8" stroke="#64748B" strokeWidth="1" />
        <g stroke="#60A5FA" strokeWidth="2" strokeLinecap="round"><path d="M10 16v2" /><path d="M14 15v2" /></g>
      </svg>
    ),
    rain: (
      <svg className={`${iconSize} ${className}`} viewBox="0 0 24 24" fill="none">
        <path d="M16 10H8a3 3 0 110-6h.5A4 4 0 0116 7a2 2 0 010 3z" fill="#64748B" stroke="#475569" strokeWidth="1" />
        <g stroke="#3B82F6" strokeWidth="2" strokeLinecap="round"><path d="M8 15v3" /><path d="M12 14v3" /><path d="M16 15v3" /></g>
      </svg>
    ),
    'rain-heavy': (
      <svg className={`${iconSize} ${className}`} viewBox="0 0 24 24" fill="none">
        <path d="M16 8H8a3 3 0 110-6h.5A4 4 0 0116 5a2 2 0 010 3z" fill="#475569" stroke="#334155" strokeWidth="1" />
        <g stroke="#2563EB" strokeWidth="2" strokeLinecap="round"><path d="M6 13v4" /><path d="M10 12v4" /><path d="M14 13v4" /><path d="M18 12v4" /></g>
      </svg>
    ),
    drizzle: (
      <svg className={`${iconSize} ${className}`} viewBox="0 0 24 24" fill="none">
        <path d="M16 11H8a3 3 0 110-6h.5A4 4 0 0116 8a2 2 0 010 3z" fill="#94A3B8" stroke="#64748B" strokeWidth="1" />
        <g stroke="#93C5FD" strokeWidth="1.5" strokeLinecap="round"><path d="M9 16v1" /><path d="M12 15v1" /><path d="M15 17v1" /><path d="M10 19v1" /><path d="M14 19v1" /></g>
      </svg>
    ),
    thunderstorm: (
      <svg className={`${iconSize} ${className}`} viewBox="0 0 24 24" fill="none">
        <path d="M16 9H8a3 3 0 110-6h.5A4 4 0 0116 6a2 2 0 010 3z" fill="#475569" stroke="#334155" strokeWidth="1" />
        <path d="M13 10l-2 5h3l-2 6" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    snow: (
      <svg className={`${iconSize} ${className}`} viewBox="0 0 24 24" fill="none">
        <path d="M16 10H8a3 3 0 110-6h.5A4 4 0 0116 7a2 2 0 010 3z" fill="#94A3B8" stroke="#64748B" strokeWidth="1" />
        <g fill="#DBEAFE"><circle cx="8" cy="15" r="1.5" /><circle cx="12" cy="14" r="1.5" /><circle cx="16" cy="16" r="1.5" /><circle cx="10" cy="18" r="1.5" /><circle cx="14" cy="19" r="1.5" /></g>
      </svg>
    ),
    'snow-heavy': (
      <svg className={`${iconSize} ${className}`} viewBox="0 0 24 24" fill="none">
        <path d="M16 8H8a3 3 0 110-6h.5A4 4 0 0116 5a2 2 0 010 3z" fill="#64748B" stroke="#475569" strokeWidth="1" />
        <g fill="#E0F2FE"><circle cx="6" cy="13" r="1.5" /><circle cx="10" cy="12" r="1.5" /><circle cx="14" cy="13" r="1.5" /><circle cx="18" cy="12" r="1.5" /><circle cx="8" cy="16" r="1.5" /><circle cx="12" cy="17" r="1.5" /><circle cx="16" cy="16" r="1.5" /><circle cx="10" cy="20" r="1.5" /><circle cx="14" cy="20" r="1.5" /></g>
      </svg>
    ),
    sleet: (
      <svg className={`${iconSize} ${className}`} viewBox="0 0 24 24" fill="none">
        <path d="M16 9H8a3 3 0 110-6h.5A4 4 0 0116 6a2 2 0 010 3z" fill="#64748B" stroke="#475569" strokeWidth="1" />
        <path d="M8 14v2" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="15" r="1.5" fill="#DBEAFE" />
        <path d="M16 14v2" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" />
        <circle cx="10" cy="19" r="1.5" fill="#DBEAFE" />
        <path d="M14 18v2" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    fog: (
      <svg className={`${iconSize} ${className}`} viewBox="0 0 24 24" fill="none">
        <g stroke="#94A3B8" strokeWidth="2" strokeLinecap="round"><path d="M3 8h18" /><path d="M5 12h14" /><path d="M3 16h18" /><path d="M7 20h10" /></g>
      </svg>
    ),
    mist: (
      <svg className={`${iconSize} ${className}`} viewBox="0 0 24 24" fill="none">
        <g stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round"><path d="M4 6h16" opacity="0.5" /><path d="M6 10h12" opacity="0.7" /><path d="M4 14h16" opacity="0.9" /><path d="M8 18h8" /></g>
      </svg>
    ),
    wind: (
      <svg className={`${iconSize} ${className}`} viewBox="0 0 24 24" fill="none">
        <g stroke="#94A3B8" strokeWidth="2" strokeLinecap="round"><path d="M9.59 4.59A2 2 0 1111 8H2" /><path d="M12.59 19.41A2 2 0 1014 16H2" /><path d="M17.73 7.73A2.5 2.5 0 1119.5 12H2" /></g>
      </svg>
    ),
  };

  return icons[type] || icons['cloudy'];
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function WeatherPage() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchWeather = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/weather');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to fetch weather data');
      }
      const data: WeatherData = await response.json();
      setWeather(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchWeather]);

  if (loading && !weather) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorDisplay message={error} onRetry={fetchWeather} />;
  }

  if (!weather) return null;

  const isDay = isDaytime(Math.floor(Date.now() / 1000), weather.current.sunrise, weather.current.sunset);
  const currentIcon = mapWeatherToIcon(weather.current.weather[0].id, isDay);

  return (
    <div className="h-full flex flex-col gap-4 overflow-y-auto">
      {/* Header */}
      <header className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#3b82f6] to-[#60a5fa] flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">Weather</h1>
            <p className="text-[11px] text-gray-500">
              {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}` : 'Loading...'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchWeather}
          disabled={loading}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1a1a22] hover:bg-[#22222c] border border-[#2a2a33] text-gray-400 hover:text-white text-xs font-medium transition-all disabled:opacity-50"
        >
          <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="hidden sm:inline">{loading ? 'Updating' : 'Refresh'}</span>
        </button>
      </header>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-3 gap-4 min-h-0">
        {/* Left Column - Current Weather & Hourly */}
        <div className="xl:col-span-2 flex flex-col gap-4">
          {/* Current Weather Card */}
          <div className="bg-gradient-to-br from-[#1a1a22] to-[#14141a] rounded-2xl border border-[#2a2a33] p-5 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#3b82f6]/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-10 w-32 h-32 bg-[#8b5cf6]/5 rounded-full blur-3xl pointer-events-none" />

            <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5">
              {/* Icon */}
              <div className="p-3 bg-[#22222c]/80 rounded-2xl border border-[#2a2a33]/50 backdrop-blur-sm">
                <WeatherIcon type={currentIcon} size="2xl" />
              </div>

              {/* Temperature & Description */}
              <div className="flex-1">
                <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  <span>{weather.current.location}, {weather.current.country}</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-6xl font-bold text-white tracking-tight">{Math.round(weather.current.temp)}</span>
                  <span className="text-2xl text-gray-500 font-light">°C</span>
                </div>
                <p className="text-[#3b82f6] font-medium text-sm mt-0.5">{capitalizeDescription(weather.current.weather[0].description)}</p>
                <p className="text-gray-500 text-xs mt-0.5">Feels like {Math.round(weather.current.feels_like)}°C</p>
              </div>

              {/* Quick Stats */}
              <div className="hidden md:flex flex-col gap-2 text-right">
                <QuickStat icon="humidity" label="Humidity" value={`${weather.current.humidity}%`} />
                <QuickStat icon="wind" label="Wind" value={`${msToKmh(weather.current.wind_speed)} km/h`} />
                <QuickStat icon="visibility" label="Visibility" value={formatVisibility(weather.current.visibility)} />
              </div>
            </div>
          </div>

          {/* Hourly Forecast */}
          <div className="bg-[#1a1a22] rounded-2xl border border-[#2a2a33] p-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Next 12 Hours</h3>
            <div className="grid grid-cols-6 lg:grid-cols-12 gap-2">
              {weather.hourly.slice(0, 12).map((hour, index) => {
                const hourIsDay = isDaytime(hour.dt, weather.current.sunrise, weather.current.sunset);
                const iconType = mapWeatherToIcon(hour.weather[0].id, hourIsDay);
                const isNow = index === 0;

                return (
                  <div
                    key={hour.dt}
                    className={`flex flex-col items-center py-2 px-1 rounded-xl transition-all ${
                      isNow
                        ? 'bg-[#3b82f6]/15 ring-1 ring-[#3b82f6]/30'
                        : 'bg-[#14141a] hover:bg-[#1e1e28]'
                    }`}
                  >
                    <span className={`text-[10px] font-medium mb-1.5 ${isNow ? 'text-[#3b82f6]' : 'text-gray-500'}`}>
                      {isNow ? 'Now' : formatHour(hour.dt, weather.timezone)}
                    </span>
                    <WeatherIcon type={iconType} size="sm" />
                    <span className="text-xs font-bold text-white mt-1.5">{Math.round(hour.temp)}°</span>
                    {hour.pop > 0.1 && (
                      <span className="text-[9px] text-blue-400 mt-0.5">{Math.round(hour.pop * 100)}%</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5-Day Forecast */}
          <div className="bg-[#1a1a22] rounded-2xl border border-[#2a2a33] p-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">5-Day Forecast</h3>
            <div className="space-y-2">
              {weather.daily.map((day, index) => {
                const iconType = mapWeatherToIcon(day.weather.id, true);
                const isToday = index === 0;
                const allTemps = weather.daily.flatMap(d => [d.temp_min, d.temp_max]);
                const globalMin = Math.min(...allTemps);
                const globalMax = Math.max(...allTemps);
                const tempRange = globalMax - globalMin || 1;
                const barLeft = ((day.temp_min - globalMin) / tempRange) * 100;
                const barWidth = ((day.temp_max - day.temp_min) / tempRange) * 100;

                return (
                  <div
                    key={day.date}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                      isToday
                        ? 'bg-[#3b82f6]/10 ring-1 ring-[#3b82f6]/20'
                        : 'bg-[#14141a] hover:bg-[#1e1e28]'
                    }`}
                  >
                    <div className="w-16 flex-shrink-0">
                      <span className={`text-sm font-medium ${isToday ? 'text-[#3b82f6]' : 'text-gray-300'}`}>
                        {isToday ? 'Today' : day.day.slice(0, 3)}
                      </span>
                    </div>
                    <div className="flex-shrink-0">
                      <WeatherIcon type={iconType} size="sm" />
                    </div>
                    <div className="w-10 flex-shrink-0 text-center">
                      {day.pop > 0.1 ? (
                        <span className="text-[10px] text-blue-400 font-medium">{Math.round(day.pop * 100)}%</span>
                      ) : (
                        <span className="text-[10px] text-gray-600">—</span>
                      )}
                    </div>
                    <div className="flex-1 flex items-center gap-3">
                      <span className="text-xs text-gray-500 w-8 text-right font-medium">{day.temp_min}°</span>
                      <div className="flex-1 h-1.5 bg-[#22222c] rounded-full relative overflow-hidden">
                        <div
                          className="absolute h-full bg-gradient-to-r from-blue-500 via-amber-400 to-orange-500 rounded-full"
                          style={{ left: `${barLeft}%`, width: `${Math.max(barWidth, 10)}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-white w-8">{day.temp_max}°</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column - Details */}
        <div className="flex flex-col gap-4">
          {/* Sun & Moon */}
          <div className="bg-[#1a1a22] rounded-2xl border border-[#2a2a33] p-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Sun & Moon</h3>
            <div className="grid grid-cols-2 gap-3">
              <DetailCard
                icon="sunrise"
                label="Sunrise"
                value={formatTime(weather.current.sunrise, weather.timezone)}
                color="text-amber-400"
              />
              <DetailCard
                icon="sunset"
                label="Sunset"
                value={formatTime(weather.current.sunset, weather.timezone)}
                color="text-orange-400"
              />
            </div>
          </div>

          {/* Conditions */}
          <div className="bg-[#1a1a22] rounded-2xl border border-[#2a2a33] p-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Conditions</h3>
            <div className="grid grid-cols-2 gap-3">
              <DetailCard
                icon="humidity"
                label="Humidity"
                value={`${weather.current.humidity}%`}
                color="text-cyan-400"
              />
              <DetailCard
                icon="wind"
                label="Wind"
                value={`${msToKmh(weather.current.wind_speed)} km/h`}
                color="text-teal-400"
              />
              <DetailCard
                icon="visibility"
                label="Visibility"
                value={formatVisibility(weather.current.visibility)}
                color="text-blue-400"
              />
              <DetailCard
                icon="pressure"
                label="Pressure"
                value={`${weather.current.pressure} hPa`}
                color="text-purple-400"
              />
            </div>
          </div>

          {/* Air Quality placeholder */}
          <div className="bg-[#1a1a22] rounded-2xl border border-[#2a2a33] p-4 flex-1">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Today&apos;s Summary</h3>
            <div className="space-y-3">
              <SummaryRow
                label="High / Low"
                value={`${weather.daily[0]?.temp_max ?? '—'}° / ${weather.daily[0]?.temp_min ?? '—'}°`}
              />
              <SummaryRow
                label="Precipitation"
                value={weather.daily[0]?.pop > 0.1 ? `${Math.round(weather.daily[0].pop * 100)}% chance` : 'Unlikely'}
              />
              <SummaryRow
                label="Cloudiness"
                value={`${weather.current.clouds}%`}
              />
              <SummaryRow
                label="Wind Direction"
                value={getWindDirection(weather.current.wind_deg)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// HELPER COMPONENTS
// ============================================

function QuickStat({ icon, label, value }: { icon: string; label: string; value: string }) {
  const iconMap: Record<string, React.ReactNode> = {
    humidity: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3c-4.97 4.25-7.5 7.94-7.5 11.05C4.5 18.18 7.86 21 12 21s7.5-2.82 7.5-6.95c0-3.11-2.53-6.8-7.5-11.05z" />
      </svg>
    ),
    wind: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.59 4.59A2 2 0 1111 8H2m10.59 11.41A2 2 0 1014 16H2m15.73-8.27A2.5 2.5 0 1119.5 12H2" />
      </svg>
    ),
    visibility: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
  };

  return (
    <div className="flex items-center gap-2 justify-end">
      <div className="text-right">
        <p className="text-[10px] text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-semibold text-white">{value}</p>
      </div>
      <div className="text-gray-400">{iconMap[icon]}</div>
    </div>
  );
}

function DetailCard({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  const iconMap: Record<string, React.ReactNode> = {
    sunrise: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    sunset: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
    ),
    humidity: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3c-4.97 4.25-7.5 7.94-7.5 11.05C4.5 18.18 7.86 21 12 21s7.5-2.82 7.5-6.95c0-3.11-2.53-6.8-7.5-11.05z" />
      </svg>
    ),
    wind: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.59 4.59A2 2 0 1111 8H2m10.59 11.41A2 2 0 1014 16H2m15.73-8.27A2.5 2.5 0 1119.5 12H2" />
      </svg>
    ),
    visibility: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
    pressure: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  };

  return (
    <div className="bg-[#14141a] rounded-xl p-3 border border-[#2a2a33]/50 hover:border-[#2a2a33] transition-colors">
      <div className={`${color} mb-2`}>
        {iconMap[icon]}
      </div>
      <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[#2a2a33]/50 last:border-0">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm font-medium text-white">{value}</span>
    </div>
  );
}

// ============================================
// ERROR DISPLAY
// ============================================

function ErrorDisplay({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="h-full flex items-center justify-center p-4">
      <div className="bg-[#1a1a22] rounded-2xl p-8 border border-red-500/20 text-center max-w-sm">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
          <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-white mb-2">Unable to Load Weather</h3>
        <p className="text-sm text-gray-400 mb-5">{message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white text-sm font-medium rounded-xl transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Try Again
        </button>
      </div>
    </div>
  );
}

// ============================================
// LOADING SKELETON
// ============================================

function LoadingSkeleton() {
  return (
    <div className="h-full flex flex-col gap-4 animate-pulse p-1">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#1a1a22]" />
          <div>
            <div className="w-20 h-4 bg-[#1a1a22] rounded mb-1" />
            <div className="w-16 h-3 bg-[#1a1a22] rounded" />
          </div>
        </div>
        <div className="w-20 h-8 bg-[#1a1a22] rounded-lg" />
      </div>

      {/* Main content skeleton */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 flex flex-col gap-4">
          <div className="h-40 bg-[#1a1a22] rounded-2xl" />
          <div className="h-32 bg-[#1a1a22] rounded-2xl" />
          <div className="flex-1 bg-[#1a1a22] rounded-2xl min-h-[200px]" />
        </div>
        <div className="flex flex-col gap-4">
          <div className="h-32 bg-[#1a1a22] rounded-2xl" />
          <div className="h-40 bg-[#1a1a22] rounded-2xl" />
          <div className="flex-1 bg-[#1a1a22] rounded-2xl min-h-[120px]" />
        </div>
      </div>
    </div>
  );
}
