'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  type WeatherData,
  type WeatherIconType,
  mapWeatherToIcon,
  capitalizeDescription,
  isDaytime,
  formatHour,
} from '@/lib/weather';

interface Goal {
  id: string;
  title: string;
  description?: string;
  status: string;
  progress?: number;
  milestones?: { id: string; completed: boolean }[];
}

export default function Home() {
  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">
              Welcome back, <span className="text-[#3b82f6]">Harry</span>
            </h1>
            <p className="text-gray-500 text-[11px]">Stay focused, stay intentional</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="hidden lg:flex items-center gap-2">
          <MiniStat label="Focus" value="4h 32m" icon="clock" />
          <MiniStat label="Tasks" value="12/15" icon="check" />
          <MiniStat label="Steps" value="8,432" icon="fire" />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-hidden">
        {/* Weather Preview */}
        <WeatherPreview />

        {/* Goals Preview */}
        <GoalsPreview />

        {/* Bottom Row - Static Cards */}
        <div className="lg:col-span-2 grid grid-cols-2 lg:grid-cols-4 gap-3">
          <NavCard
            title="Focus Mode"
            description="3 tasks pending"
            icon="clock"
            gradient="from-[#3b82f6] to-cyan-500"
            href="/focus"
          />
          <NavCard
            title="Fitness"
            description="8,432 steps today"
            icon="heart"
            gradient="from-red-500 to-pink-500"
            href="/fitness"
          />
          <NavCard
            title="AI Assistant"
            description="Ready to help"
            icon="bot"
            gradient="from-purple-500 to-violet-500"
            href="/chatbot"
          />
          <NavCard
            title="Quick Notes"
            description="3 unprocessed notes"
            icon="edit"
            gradient="from-yellow-500 to-amber-500"
            href="/notes"
          />
        </div>
      </div>
    </div>
  );
}

// ============================================
// WEATHER PREVIEW WIDGET
// ============================================

function WeatherPreview() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchWeather = useCallback(async () => {
    try {
      const response = await fetch('/api/weather');
      if (response.ok) {
        const data: WeatherData = await response.json();
        setWeather(data);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  const isDay = weather
    ? isDaytime(Math.floor(Date.now() / 1000), weather.current.sunrise, weather.current.sunset)
    : true;

  return (
    <Link href="/weather" className="group block">
      <div className="h-full bg-gradient-to-br from-[#1a1a22] to-[#14141a] rounded-2xl border border-[#2a2a33] p-4 flex flex-col transition-all hover:border-[#3b82f6]/40 hover:shadow-lg hover:shadow-[#3b82f6]/5 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between mb-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-white">Weather</span>
          </div>
          <div className="flex items-center gap-1 text-[#3b82f6] text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            <span>View</span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-[#3b82f6]/30 border-t-[#3b82f6] rounded-full animate-spin" />
          </div>
        ) : weather ? (
          <div className="flex-1 flex flex-col">
            {/* Current Weather */}
            <div className="flex items-center gap-4 mb-4">
              <div className="p-2 bg-[#22222c]/60 rounded-xl">
                <WeatherIcon type={mapWeatherToIcon(weather.current.weather[0].id, isDay)} size="lg" />
              </div>
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">{Math.round(weather.current.temp)}</span>
                  <span className="text-lg text-gray-500">°C</span>
                </div>
                <p className="text-sm text-[#3b82f6] font-medium">{capitalizeDescription(weather.current.weather[0].description)}</p>
                <p className="text-xs text-gray-500">{weather.current.location}</p>
              </div>
            </div>

            {/* Hourly Preview */}
            <div className="flex-1 min-h-0">
              <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-2">Next Hours</p>
              <div className="grid grid-cols-5 gap-2">
                {weather.hourly.slice(1, 6).map((hour) => {
                  const hourIsDay = isDaytime(hour.dt, weather.current.sunrise, weather.current.sunset);
                  const iconType = mapWeatherToIcon(hour.weather[0].id, hourIsDay);
                  return (
                    <div key={hour.dt} className="flex flex-col items-center py-1.5 px-1 bg-[#14141a] rounded-lg">
                      <span className="text-[10px] text-gray-500 mb-1">{formatHour(hour.dt, weather.timezone)}</span>
                      <WeatherIcon type={iconType} size="sm" />
                      <span className="text-xs font-semibold text-white mt-1">{Math.round(hour.temp)}°</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-gray-500">Unable to load weather</p>
          </div>
        )}
      </div>
    </Link>
  );
}

// ============================================
// GOALS PREVIEW WIDGET
// ============================================

function GoalsPreview() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await supabase
          .from('goals')
          .select('*, milestones(*)')
          .order('created_at', { ascending: false })
          .limit(4);
        if (data) setGoals(data);
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const totalGoals = goals.length;
  const inProgressGoals = goals.filter((g) => g.status === 'In Progress').length;
  const avgProgress = goals.length > 0
    ? Math.round(goals.reduce((sum, g) => sum + (g.progress || 0), 0) / goals.length)
    : 0;

  return (
    <Link href="/goals" className="group block">
      <div className="h-full bg-gradient-to-br from-[#1a1a22] to-[#14141a] rounded-2xl border border-[#2a2a33] p-4 flex flex-col transition-all hover:border-[#3b82f6]/40 hover:shadow-lg hover:shadow-[#3b82f6]/5 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-green-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between mb-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-white">Goals</span>
          </div>
          <div className="flex items-center gap-1 text-[#3b82f6] text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            <span>View</span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-[#3b82f6]/30 border-t-[#3b82f6] rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            {/* Stats Row */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 bg-[#14141a] rounded-xl p-3">
                <p className="text-[10px] text-gray-500 uppercase mb-0.5">Total</p>
                <p className="text-2xl font-bold text-white">{totalGoals}</p>
              </div>
              <div className="flex-1 bg-[#14141a] rounded-xl p-3">
                <p className="text-[10px] text-gray-500 uppercase mb-0.5">Active</p>
                <p className="text-2xl font-bold text-yellow-400">{inProgressGoals}</p>
              </div>
              <div className="flex-1 bg-[#14141a] rounded-xl p-3">
                <p className="text-[10px] text-gray-500 uppercase mb-0.5">Progress</p>
                <p className="text-2xl font-bold text-[#3b82f6]">{avgProgress}%</p>
              </div>
            </div>

            {/* Goals List */}
            <div className="flex-1 min-h-0 space-y-2 overflow-hidden">
              {goals.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-gray-500">No goals yet</p>
                </div>
              ) : (
                goals.slice(0, 3).map((goal) => {
                  const milestones = goal.milestones ?? [];
                  const completed = milestones.filter((m) => m.completed).length;
                  const total = milestones.length;
                  const progress = total === 0 ? goal.progress ?? 0 : Math.round((completed / total) * 100);

                  return (
                    <div key={goal.id} className="flex items-center gap-3 p-2 bg-[#14141a] rounded-lg">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        goal.status === 'Completed' ? 'bg-green-500' :
                        goal.status === 'In Progress' ? 'bg-yellow-500' : 'bg-gray-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate">{goal.title}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="w-16 h-1 bg-[#22222c] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] rounded-full"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-gray-400 w-7 text-right">{progress}%</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}

// ============================================
// WEATHER ICON COMPONENT (Simplified)
// ============================================

function WeatherIcon({ type, size = 'md' }: { type: WeatherIconType; size?: 'sm' | 'md' | 'lg' }) {
  const sizeMap = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };
  const iconSize = sizeMap[size];

  const icons: Partial<Record<WeatherIconType, React.ReactNode>> = {
    'clear-day': (
      <svg className={iconSize} viewBox="0 0 24 24" fill="none">
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
      <svg className={iconSize} viewBox="0 0 24 24" fill="none">
        <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" fill="#93C5FD" stroke="#60A5FA" strokeWidth="1.5" />
      </svg>
    ),
    'partly-cloudy-day': (
      <svg className={iconSize} viewBox="0 0 24 24" fill="none">
        <circle cx="9" cy="7" r="3" fill="#FBBF24" />
        <path d="M19 18H9a4 4 0 110-8h.5a5 5 0 019.5 3 3 3 0 010 5z" fill="#E5E7EB" stroke="#D1D5DB" strokeWidth="1" />
      </svg>
    ),
    'partly-cloudy-night': (
      <svg className={iconSize} viewBox="0 0 24 24" fill="none">
        <path d="M13 4a5 5 0 015 5 3 3 0 01-5-5z" fill="#93C5FD" />
        <path d="M19 18H9a4 4 0 110-8h.5a5 5 0 019.5 3 3 3 0 010 5z" fill="#94A3B8" stroke="#64748B" strokeWidth="1" />
      </svg>
    ),
    cloudy: (
      <svg className={iconSize} viewBox="0 0 24 24" fill="none">
        <path d="M18 18H6a5 5 0 01-.5-9.98 7 7 0 0113.5 2.98A4 4 0 0118 18z" fill="#94A3B8" stroke="#64748B" strokeWidth="1" />
      </svg>
    ),
    rain: (
      <svg className={iconSize} viewBox="0 0 24 24" fill="none">
        <path d="M16 10H8a3 3 0 110-6h.5A4 4 0 0116 7a2 2 0 010 3z" fill="#64748B" stroke="#475569" strokeWidth="1" />
        <g stroke="#3B82F6" strokeWidth="2" strokeLinecap="round"><path d="M8 15v3" /><path d="M12 14v3" /><path d="M16 15v3" /></g>
      </svg>
    ),
    snow: (
      <svg className={iconSize} viewBox="0 0 24 24" fill="none">
        <path d="M16 10H8a3 3 0 110-6h.5A4 4 0 0116 7a2 2 0 010 3z" fill="#94A3B8" stroke="#64748B" strokeWidth="1" />
        <g fill="#DBEAFE"><circle cx="8" cy="15" r="1.5" /><circle cx="12" cy="14" r="1.5" /><circle cx="16" cy="16" r="1.5" /></g>
      </svg>
    ),
    thunderstorm: (
      <svg className={iconSize} viewBox="0 0 24 24" fill="none">
        <path d="M16 9H8a3 3 0 110-6h.5A4 4 0 0116 6a2 2 0 010 3z" fill="#475569" stroke="#334155" strokeWidth="1" />
        <path d="M13 10l-2 5h3l-2 6" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  };

  return icons[type] || icons['cloudy'] || (
    <svg className={iconSize} viewBox="0 0 24 24" fill="none">
      <path d="M18 18H6a5 5 0 01-.5-9.98 7 7 0 0113.5 2.98A4 4 0 0118 18z" fill="#94A3B8" stroke="#64748B" strokeWidth="1" />
    </svg>
  );
}

// ============================================
// MINI STAT COMPONENT
// ============================================

function MiniStat({ label, value, icon }: { label: string; value: string; icon: string }) {
  const iconMap: Record<string, React.ReactNode> = {
    clock: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    check: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    fire: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
      </svg>
    ),
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-[#1a1a22] rounded-xl border border-[#2a2a33] flex-shrink-0 hover:border-[#3b82f6]/30 transition-colors">
      <span className="text-[#3b82f6]">{iconMap[icon]}</span>
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-gray-500 uppercase tracking-wide">{label}</span>
        <span className="text-sm font-bold text-white">{value}</span>
      </div>
    </div>
  );
}

// ============================================
// NAVIGATION CARD COMPONENT
// ============================================

function NavCard({
  title,
  description,
  icon,
  gradient,
  href,
}: {
  title: string;
  description: string;
  icon: string;
  gradient: string;
  href: string;
}) {
  const iconMap: Record<string, React.ReactNode> = {
    clock: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    heart: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    bot: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    edit: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  };

  return (
    <Link href={href} className="group block">
      <div className="h-full bg-[#1a1a22] rounded-2xl border border-[#2a2a33] p-4 flex flex-col transition-all duration-200 hover:border-[#3b82f6]/40 hover:bg-[#1e1e28]">
        <div
          className={`w-9 h-9 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-white mb-2 group-hover:scale-105 transition-transform duration-200`}
        >
          {iconMap[icon]}
        </div>
        <h3 className="text-sm font-semibold text-white mb-0.5 group-hover:text-[#3b82f6] transition-colors">
          {title}
        </h3>
        <p className="text-[11px] text-gray-500 line-clamp-1">{description}</p>
      </div>
    </Link>
  );
}
