'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  type WeatherData,
  type WeatherIconType,
  type HourlyForecast,
  type DailyForecast,
  formatHour,
  formatTime,
  mapWeatherToIcon,
  capitalizeDescription,
  isDaytime,
  msToKmh,
  getWindDirection,
  formatVisibility,
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
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const sizeMap = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-24 h-24',
  };

  const iconSize = sizeMap[size];

  const icons: Record<WeatherIconType, React.ReactNode> = {
    'clear-day': (
      <svg className={`${iconSize} ${className}`} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="4" fill="#FBBF24" />
        <g stroke="#FBBF24" strokeWidth="2" strokeLinecap="round">
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="M4.93 4.93l1.41 1.41" />
          <path d="M17.66 17.66l1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="M6.34 17.66l-1.41 1.41" />
          <path d="M19.07 4.93l-1.41 1.41" />
        </g>
      </svg>
    ),
    'clear-night': (
      <svg className={`${iconSize} ${className}`} viewBox="0 0 24 24" fill="none">
        <path
          d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
          fill="#93C5FD"
          stroke="#60A5FA"
          strokeWidth="1.5"
        />
      </svg>
    ),
    'partly-cloudy-day': (
      <svg className={`${iconSize} ${className}`} viewBox="0 0 24 24" fill="none">
        <circle cx="9" cy="7" r="3" fill="#FBBF24" />
        <g stroke="#FBBF24" strokeWidth="1.5" strokeLinecap="round">
          <path d="M9 2v1" />
          <path d="M9 11v1" />
          <path d="M4 7H3" />
          <path d="M14 7h1" />
          <path d="M5.5 3.5l.7.7" />
          <path d="M12.5 10.5l.7.7" />
          <path d="M5.5 10.5l-.7.7" />
          <path d="M12.5 3.5l.7-.7" />
        </g>
        <path
          d="M19 18H9a4 4 0 110-8h.5a5 5 0 019.5 3 3 3 0 010 5z"
          fill="#E5E7EB"
          stroke="#D1D5DB"
          strokeWidth="1"
        />
      </svg>
    ),
    'partly-cloudy-night': (
      <svg className={`${iconSize} ${className}`} viewBox="0 0 24 24" fill="none">
        <path d="M13 4a5 5 0 015 5 3 3 0 01-5-5z" fill="#93C5FD" />
        <path
          d="M19 18H9a4 4 0 110-8h.5a5 5 0 019.5 3 3 3 0 010 5z"
          fill="#94A3B8"
          stroke="#64748B"
          strokeWidth="1"
        />
      </svg>
    ),
    cloudy: (
      <svg className={`${iconSize} ${className}`} viewBox="0 0 24 24" fill="none">
        <path
          d="M18 18H6a5 5 0 01-.5-9.98 7 7 0 0113.5 2.98A4 4 0 0118 18z"
          fill="#94A3B8"
          stroke="#64748B"
          strokeWidth="1"
        />
      </svg>
    ),
    overcast: (
      <svg className={`${iconSize} ${className}`} viewBox="0 0 24 24" fill="none">
        <path
          d="M20 16H8a4 4 0 110-8h.5A5 5 0 0118 11a3 3 0 012 5z"
          fill="#64748B"
          stroke="#475569"
          strokeWidth="1"
        />
        <path
          d="M16 20H6a3 3 0 110-6h.5a4 4 0 017.5 2 2 2 0 012 4z"
          fill="#94A3B8"
          stroke="#64748B"
          strokeWidth="1"
        />
      </svg>
    ),
    'rain-light': (
      <svg className={`${iconSize} ${className}`} viewBox="0 0 24 24" fill="none">
        <path
          d="M16 12H8a3 3 0 110-6h.5A4 4 0 0116 9a2 2 0 010 3z"
          fill="#94A3B8"
          stroke="#64748B"
          strokeWidth="1"
        />
        <g stroke="#60A5FA" strokeWidth="2" strokeLinecap="round">
          <path d="M10 16v2" />
          <path d="M14 15v2" />
        </g>
      </svg>
    ),
    rain: (
      <svg className={`${iconSize} ${className}`} viewBox="0 0 24 24" fill="none">
        <path
          d="M16 10H8a3 3 0 110-6h.5A4 4 0 0116 7a2 2 0 010 3z"
          fill="#64748B"
          stroke="#475569"
          strokeWidth="1"
        />
        <g stroke="#3B82F6" strokeWidth="2" strokeLinecap="round">
          <path d="M8 15v3" />
          <path d="M12 14v3" />
          <path d="M16 15v3" />
        </g>
      </svg>
    ),
    'rain-heavy': (
      <svg className={`${iconSize} ${className}`} viewBox="0 0 24 24" fill="none">
        <path
          d="M16 8H8a3 3 0 110-6h.5A4 4 0 0116 5a2 2 0 010 3z"
          fill="#475569"
          stroke="#334155"
          strokeWidth="1"
        />
        <g stroke="#2563EB" strokeWidth="2" strokeLinecap="round">
          <path d="M6 13v4" />
          <path d="M10 12v4" />
          <path d="M14 13v4" />
          <path d="M18 12v4" />
        </g>
      </svg>
    ),
    drizzle: (
      <svg className={`${iconSize} ${className}`} viewBox="0 0 24 24" fill="none">
        <path
          d="M16 11H8a3 3 0 110-6h.5A4 4 0 0116 8a2 2 0 010 3z"
          fill="#94A3B8"
          stroke="#64748B"
          strokeWidth="1"
        />
        <g stroke="#93C5FD" strokeWidth="1.5" strokeLinecap="round">
          <path d="M9 16v1" />
          <path d="M12 15v1" />
          <path d="M15 17v1" />
          <path d="M10 19v1" />
          <path d="M14 19v1" />
        </g>
      </svg>
    ),
    thunderstorm: (
      <svg className={`${iconSize} ${className}`} viewBox="0 0 24 24" fill="none">
        <path
          d="M16 9H8a3 3 0 110-6h.5A4 4 0 0116 6a2 2 0 010 3z"
          fill="#475569"
          stroke="#334155"
          strokeWidth="1"
        />
        <path d="M13 10l-2 5h3l-2 6" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    snow: (
      <svg className={`${iconSize} ${className}`} viewBox="0 0 24 24" fill="none">
        <path
          d="M16 10H8a3 3 0 110-6h.5A4 4 0 0116 7a2 2 0 010 3z"
          fill="#94A3B8"
          stroke="#64748B"
          strokeWidth="1"
        />
        <g fill="#DBEAFE">
          <circle cx="8" cy="15" r="1.5" />
          <circle cx="12" cy="14" r="1.5" />
          <circle cx="16" cy="16" r="1.5" />
          <circle cx="10" cy="18" r="1.5" />
          <circle cx="14" cy="19" r="1.5" />
        </g>
      </svg>
    ),
    'snow-heavy': (
      <svg className={`${iconSize} ${className}`} viewBox="0 0 24 24" fill="none">
        <path
          d="M16 8H8a3 3 0 110-6h.5A4 4 0 0116 5a2 2 0 010 3z"
          fill="#64748B"
          stroke="#475569"
          strokeWidth="1"
        />
        <g fill="#E0F2FE">
          <circle cx="6" cy="13" r="1.5" />
          <circle cx="10" cy="12" r="1.5" />
          <circle cx="14" cy="13" r="1.5" />
          <circle cx="18" cy="12" r="1.5" />
          <circle cx="8" cy="16" r="1.5" />
          <circle cx="12" cy="17" r="1.5" />
          <circle cx="16" cy="16" r="1.5" />
          <circle cx="10" cy="20" r="1.5" />
          <circle cx="14" cy="20" r="1.5" />
        </g>
      </svg>
    ),
    sleet: (
      <svg className={`${iconSize} ${className}`} viewBox="0 0 24 24" fill="none">
        <path
          d="M16 9H8a3 3 0 110-6h.5A4 4 0 0116 6a2 2 0 010 3z"
          fill="#64748B"
          stroke="#475569"
          strokeWidth="1"
        />
        <path d="M8 14v2" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="15" r="1.5" fill="#DBEAFE" />
        <path d="M16 14v2" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" />
        <circle cx="10" cy="19" r="1.5" fill="#DBEAFE" />
        <path d="M14 18v2" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    fog: (
      <svg className={`${iconSize} ${className}`} viewBox="0 0 24 24" fill="none">
        <g stroke="#94A3B8" strokeWidth="2" strokeLinecap="round">
          <path d="M3 8h18" />
          <path d="M5 12h14" />
          <path d="M3 16h18" />
          <path d="M7 20h10" />
        </g>
      </svg>
    ),
    mist: (
      <svg className={`${iconSize} ${className}`} viewBox="0 0 24 24" fill="none">
        <g stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round">
          <path d="M4 6h16" opacity="0.5" />
          <path d="M6 10h12" opacity="0.7" />
          <path d="M4 14h16" opacity="0.9" />
          <path d="M8 18h8" />
        </g>
      </svg>
    ),
    wind: (
      <svg className={`${iconSize} ${className}`} viewBox="0 0 24 24" fill="none">
        <g stroke="#94A3B8" strokeWidth="2" strokeLinecap="round">
          <path d="M9.59 4.59A2 2 0 1111 8H2" />
          <path d="M12.59 19.41A2 2 0 1014 16H2" />
          <path d="M17.73 7.73A2.5 2.5 0 1119.5 12H2" />
        </g>
      </svg>
    ),
  };

  return icons[type] || icons['cloudy'];
}

// ============================================
// LOADING SKELETON
// ============================================

function LoadingSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Current weather skeleton */}
      <div className="bg-[#1a1a22] rounded-2xl p-8 border border-[#2a2a33]">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-2xl bg-[#22222c]" />
            <div className="space-y-3">
              <div className="h-14 w-32 bg-[#22222c] rounded-lg" />
              <div className="h-5 w-40 bg-[#22222c] rounded" />
            </div>
          </div>
          <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-20 bg-[#22222c] rounded-xl" />
            ))}
          </div>
        </div>
      </div>

      {/* Hourly skeleton */}
      <div className="space-y-4">
        <div className="h-7 w-40 bg-[#22222c] rounded" />
        <div className="flex gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-28 h-36 bg-[#1a1a22] rounded-xl border border-[#2a2a33]" />
          ))}
        </div>
      </div>

      {/* Daily skeleton */}
      <div className="space-y-4">
        <div className="h-7 w-40 bg-[#22222c] rounded" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-[#1a1a22] rounded-xl border border-[#2a2a33]" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// ERROR DISPLAY
// ============================================

function ErrorDisplay({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="bg-[#1a1a22] rounded-2xl p-8 border border-red-500/20 text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
        <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">Unable to Load Weather</h3>
      <p className="text-gray-400 mb-6 max-w-md mx-auto">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-medium rounded-lg transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Try Again
      </button>
    </div>
  );
}

// ============================================
// CURRENT WEATHER CARD
// ============================================

function CurrentWeatherCard({ data, timezone }: { data: WeatherData['current']; timezone: number }) {
  const now = Math.floor(Date.now() / 1000);
  const isDay = isDaytime(now, data.sunrise, data.sunset);
  const iconType = mapWeatherToIcon(data.weather[0].id, isDay);
  const description = capitalizeDescription(data.weather[0].description);

  return (
    <div className="dashboard-card bg-gradient-to-br from-[#1a1a22] to-[#12121a] rounded-2xl p-6 md:p-8 border border-[#2a2a33] overflow-hidden relative">
      {/* Subtle accent glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#3b82f6]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

      <div className="relative">
        {/* Location */}
        <div className="flex items-center gap-2 text-gray-400 mb-6">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-sm font-medium">{data.location}, {data.country}</span>
        </div>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Temperature Section */}
          <div className="flex items-center gap-6">
            <div className="p-4 bg-[#22222c]/50 rounded-2xl border border-[#2a2a33]">
              <WeatherIcon type={iconType} size="xl" />
            </div>
            <div>
              <div className="flex items-start">
                <span className="text-6xl md:text-7xl font-bold text-white">{Math.round(data.temp)}</span>
                <span className="text-2xl text-gray-400 mt-2">°C</span>
              </div>
              <p className="text-lg text-[#3b82f6] font-medium mt-1">{description}</p>
              <p className="text-gray-400 text-sm mt-1">
                Feels like {Math.round(data.feels_like)}°C
              </p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-3">
            <DetailCard
              icon={<SunriseIcon />}
              label="Sunrise"
              value={formatTime(data.sunrise, timezone)}
            />
            <DetailCard
              icon={<SunsetIcon />}
              label="Sunset"
              value={formatTime(data.sunset, timezone)}
            />
            <DetailCard
              icon={<HumidityIcon />}
              label="Humidity"
              value={`${data.humidity}%`}
            />
            <DetailCard
              icon={<WindIcon />}
              label="Wind"
              value={`${msToKmh(data.wind_speed)} km/h ${getWindDirection(data.wind_deg)}`}
            />
            <DetailCard
              icon={<VisibilityIcon />}
              label="Visibility"
              value={formatVisibility(data.visibility)}
            />
            <DetailCard
              icon={<PressureIcon />}
              label="Pressure"
              value={`${data.pressure} hPa`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// DETAIL CARD
// ============================================

function DetailCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-[#22222c]/50 rounded-xl p-3 border border-[#2a2a33]/50 hover:border-[#3b82f6]/30 transition-colors">
      <div className="flex items-center gap-2 text-gray-500 mb-1.5">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-white font-semibold">{value}</p>
    </div>
  );
}

// ============================================
// HOURLY FORECAST
// ============================================

function HourlyForecast({
  hourly,
  timezone,
  sunrise,
  sunset,
}: {
  hourly: HourlyForecast[];
  timezone: number;
  sunrise: number;
  sunset: number;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white">Next 12 Hours</h2>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
        {hourly.map((hour, index) => {
          const isDay = isDaytime(hour.dt, sunrise, sunset);
          const iconType = mapWeatherToIcon(hour.weather[0].id, isDay);
          const description = capitalizeDescription(hour.weather[0].description);

          return (
            <div
              key={hour.dt}
              className={`flex-shrink-0 w-28 dashboard-card bg-[#1a1a22] rounded-xl p-4 border border-[#2a2a33] text-center transition-all hover:border-[#3b82f6]/50 ${
                index === 0 ? 'ring-2 ring-[#3b82f6]/30 bg-[#3b82f6]/5' : ''
              }`}
            >
              <p className="text-sm text-gray-400 font-medium mb-3">
                {index === 0 ? 'Now' : formatHour(hour.dt, timezone)}
              </p>
              <div className="flex justify-center mb-3">
                <WeatherIcon type={iconType} size="md" />
              </div>
              <p className="text-xl font-bold text-white mb-1">{Math.round(hour.temp)}°</p>
              <p className="text-xs text-gray-500 truncate" title={description}>
                {hour.weather[0].main}
              </p>
              {hour.pop > 0.1 && (
                <div className="flex items-center justify-center gap-1 mt-2 text-xs text-blue-400">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8z" />
                  </svg>
                  {Math.round(hour.pop * 100)}%
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// DAILY FORECAST
// ============================================

function DailyForecastSection({ daily }: { daily: DailyForecast[] }) {
  // Find temp range for the gradient bar calculation
  const allTemps = daily.flatMap(d => [d.temp_min, d.temp_max]);
  const globalMin = Math.min(...allTemps);
  const globalMax = Math.max(...allTemps);
  const tempRange = globalMax - globalMin || 1;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white">5-Day Forecast</h2>
      <div className="space-y-2">
        {daily.map((day, index) => {
          const iconType = mapWeatherToIcon(day.weather.id, true);
          const description = capitalizeDescription(day.weather.description);
          const isToday = index === 0;

          // Calculate bar position and width
          const barLeft = ((day.temp_min - globalMin) / tempRange) * 100;
          const barWidth = ((day.temp_max - day.temp_min) / tempRange) * 100;

          return (
            <div
              key={day.date}
              className={`dashboard-card bg-[#1a1a22] rounded-xl p-4 border border-[#2a2a33] transition-all hover:border-[#3b82f6]/50 ${
                isToday ? 'ring-2 ring-[#3b82f6]/30 bg-[#3b82f6]/5' : ''
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Day Name */}
                <div className="w-20 md:w-24">
                  <p className="font-semibold text-white">
                    {isToday ? 'Today' : day.day}
                  </p>
                </div>

                {/* Icon */}
                <div className="flex-shrink-0">
                  <WeatherIcon type={iconType} size="md" />
                </div>

                {/* Description */}
                <div className="hidden md:block flex-1 min-w-0">
                  <p className="text-gray-400 text-sm truncate">{description}</p>
                </div>

                {/* Precipitation */}
                <div className="w-14 text-center hidden sm:block">
                  {day.pop > 0.1 ? (
                    <div className="flex items-center justify-center gap-1 text-sm text-blue-400">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8z" />
                      </svg>
                      {Math.round(day.pop * 100)}%
                    </div>
                  ) : (
                    <span className="text-gray-600">—</span>
                  )}
                </div>

                {/* Temperature Bar */}
                <div className="flex items-center gap-2 w-36 md:w-44">
                  <span className="text-gray-400 text-sm w-8 text-right">{day.temp_min}°</span>
                  <div className="flex-1 h-1.5 bg-[#22222c] rounded-full relative">
                    <div
                      className="absolute h-full bg-gradient-to-r from-blue-500 via-yellow-500 to-orange-500 rounded-full"
                      style={{
                        left: `${barLeft}%`,
                        width: `${Math.max(barWidth, 10)}%`,
                      }}
                    />
                  </div>
                  <span className="text-white font-semibold text-sm w-8">{day.temp_max}°</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// ICON COMPONENTS
// ============================================

function SunriseIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m3.343-5.657l-.707-.707m12.728 0l-.707.707M5.636 18.364l-.707.707m12.728 0l-.707-.707" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9a3 3 0 100 6 3 3 0 000-6z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 18H7" />
    </svg>
  );
}

function SunsetIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  );
}

function HumidityIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3c-4.97 4.25-7.5 7.94-7.5 11.05C4.5 18.18 7.86 21 12 21s7.5-2.82 7.5-6.95c0-3.11-2.53-6.8-7.5-11.05z" />
    </svg>
  );
}

function WindIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.59 4.59A2 2 0 1111 8H2m10.59 11.41A2 2 0 1014 16H2m15.73-8.27A2.5 2.5 0 1119.5 12H2" />
    </svg>
  );
}

function VisibilityIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function PressureIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
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

    // Auto-refresh every 10 minutes
    const interval = setInterval(fetchWeather, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchWeather]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Weather</h1>
          <p className="text-gray-400 mt-1">
            {lastUpdated
              ? `Last updated at ${lastUpdated.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
              : 'Loading current conditions...'}
          </p>
        </div>
        <button
          type="button"
          onClick={fetchWeather}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1a1a22] hover:bg-[#22222c] border border-[#2a2a33] rounded-lg text-gray-300 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg
            className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="font-medium">{loading ? 'Updating...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Content */}
      {loading && !weather ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorDisplay message={error} onRetry={fetchWeather} />
      ) : weather ? (
        <div className="space-y-8">
          <CurrentWeatherCard data={weather.current} timezone={weather.timezone} />
          <HourlyForecast
            hourly={weather.hourly}
            timezone={weather.timezone}
            sunrise={weather.current.sunrise}
            sunset={weather.current.sunset}
          />
          <DailyForecastSection daily={weather.daily} />
        </div>
      ) : null}
    </div>
  );
}
