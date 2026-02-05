'use client';

import { useState, useEffect } from 'react';
import { getGreeting, formatDate, formatTime, getTimeOfDay } from '../utils/focusTypes';
import { type WeatherData, formatTime as formatWeatherTime, isDaytime } from '@/lib/weather';

interface FocusHeaderProps {
  userName?: string;
}

export default function FocusHeader({ userName = 'Harry' }: FocusHeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weather, setWeather] = useState<WeatherData | null>(null);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch weather
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await fetch('/api/weather');
        if (response.ok) {
          const data: WeatherData = await response.json();
          setWeather(data);
        }
      } catch {
        // Silently fail
      }
    };
    fetchWeather();
  }, []);

  const timeOfDay = getTimeOfDay();
  const isDay = weather
    ? isDaytime(Math.floor(Date.now() / 1000), weather.current.sunrise, weather.current.sunset)
    : timeOfDay !== 'night';

  // Get gradient based on time of day
  const getTimeGradient = () => {
    switch (timeOfDay) {
      case 'morning':
        return 'from-amber-500 to-orange-500';
      case 'afternoon':
        return 'from-blue-500 to-cyan-500';
      case 'evening':
        return 'from-purple-500 to-pink-500';
      case 'night':
        return 'from-indigo-500 to-purple-500';
    }
  };

  // Get icon based on time of day
  const getTimeIcon = () => {
    if (timeOfDay === 'morning') {
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="4" fill="currentColor" />
          <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 2v2" /><path d="M12 20v2" />
            <path d="M4.93 4.93l1.41 1.41" /><path d="M17.66 17.66l1.41 1.41" />
            <path d="M2 12h2" /><path d="M20 12h2" />
            <path d="M6.34 17.66l-1.41 1.41" /><path d="M19.07 4.93l-1.41 1.41" />
          </g>
        </svg>
      );
    }
    if (timeOfDay === 'afternoon') {
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="5" fill="currentColor" />
          <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 1v3" /><path d="M12 20v3" />
            <path d="M4.22 4.22l2.12 2.12" /><path d="M17.66 17.66l2.12 2.12" />
            <path d="M1 12h3" /><path d="M20 12h3" />
            <path d="M4.22 19.78l2.12-2.12" /><path d="M17.66 6.34l2.12-2.12" />
          </g>
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
        <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" fill="currentColor" />
      </svg>
    );
  };

  return (
    <header className="flex-shrink-0 flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
      {/* Left: Greeting and Date */}
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getTimeGradient()} flex items-center justify-center flex-shrink-0 text-white shadow-lg`}>
          {getTimeIcon()}
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">
            {getGreeting()}, <span className="text-[#3b82f6]">{userName}</span>
          </h1>
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <span>{formatDate(currentTime)}</span>
            <span className="text-gray-600">•</span>
            <span className="font-mono">{formatTime(currentTime)}</span>
          </div>
        </div>
      </div>

      {/* Right: Weather Context */}
      {weather && (
        <div className="flex items-center gap-4 p-3 bg-[#1a1a22]/80 rounded-xl border border-[#2a2a33] backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <WeatherIcon conditionId={weather.current.weather[0].id} isDay={isDay} />
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-white">{Math.round(weather.current.temp)}</span>
                <span className="text-sm text-gray-500">°C</span>
              </div>
              <p className="text-xs text-gray-500 capitalize">{weather.current.weather[0].description}</p>
            </div>
          </div>

          <div className="w-px h-10 bg-[#2a2a33]" />

          <div className="flex flex-col gap-1 text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
              </svg>
              <span>Sunrise {formatWeatherTime(weather.current.sunrise, weather.timezone)}</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
              <span>Sunset {formatWeatherTime(weather.current.sunset, weather.timezone)}</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

// Simple Weather Icon
function WeatherIcon({ conditionId, isDay }: { conditionId: number; isDay: boolean }) {
  // Clear
  if (conditionId === 800) {
    if (isDay) {
      return (
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="4" fill="#FBBF24" />
          <g stroke="#FBBF24" strokeWidth="2" strokeLinecap="round">
            <path d="M12 2v2" /><path d="M12 20v2" />
            <path d="M4.93 4.93l1.41 1.41" /><path d="M17.66 17.66l1.41 1.41" />
            <path d="M2 12h2" /><path d="M20 12h2" />
            <path d="M6.34 17.66l-1.41 1.41" /><path d="M19.07 4.93l-1.41 1.41" />
          </g>
        </svg>
      );
    }
    return (
      <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
        <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" fill="#93C5FD" stroke="#60A5FA" strokeWidth="1.5" />
      </svg>
    );
  }

  // Clouds
  if (conditionId >= 801 && conditionId <= 804) {
    return (
      <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
        <path d="M18 18H6a5 5 0 01-.5-9.98 7 7 0 0113.5 2.98A4 4 0 0118 18z" fill="#94A3B8" stroke="#64748B" strokeWidth="1" />
      </svg>
    );
  }

  // Rain
  if (conditionId >= 500 && conditionId < 600) {
    return (
      <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
        <path d="M16 10H8a3 3 0 110-6h.5A4 4 0 0116 7a2 2 0 010 3z" fill="#64748B" stroke="#475569" strokeWidth="1" />
        <g stroke="#3B82F6" strokeWidth="2" strokeLinecap="round">
          <path d="M8 15v3" /><path d="M12 14v3" /><path d="M16 15v3" />
        </g>
      </svg>
    );
  }

  // Default cloudy
  return (
    <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
      <path d="M18 18H6a5 5 0 01-.5-9.98 7 7 0 0113.5 2.98A4 4 0 0118 18z" fill="#94A3B8" stroke="#64748B" strokeWidth="1" />
    </svg>
  );
}
