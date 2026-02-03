// ============================================
// WEATHER TYPES - Free API Structure
// ============================================

export interface WeatherCondition {
  id: number;
  main: string;
  description: string;
  icon: string;
}

export interface CurrentWeather {
  temp: number;
  feels_like: number;
  temp_min: number;
  temp_max: number;
  humidity: number;
  pressure: number;
  visibility: number;
  wind_speed: number;
  wind_deg: number;
  clouds: number;
  sunrise: number;
  sunset: number;
  weather: WeatherCondition[];
  location: string;
  country: string;
}

export interface HourlyForecast {
  dt: number;
  temp: number;
  feels_like: number;
  humidity: number;
  weather: WeatherCondition[];
  pop: number; // Probability of precipitation (0-1)
  wind_speed: number;
}

export interface DailyForecast {
  date: string;
  day: string;
  temp_min: number;
  temp_max: number;
  weather: WeatherCondition;
  humidity: number;
  pop: number;
}

export interface WeatherData {
  current: CurrentWeather;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
  timezone: number; // Timezone offset in seconds
}

// ============================================
// FORMATTING HELPERS
// ============================================

/**
 * Format Unix timestamp to hour string (e.g., "14:00")
 */
export function formatHour(timestamp: number, timezoneOffset: number = 0): string {
  const date = new Date((timestamp + timezoneOffset) * 1000);
  const hours = date.getUTCHours();
  return `${hours.toString().padStart(2, '0')}:00`;
}

/**
 * Format Unix timestamp to day string (e.g., "Tue 4")
 */
export function formatDay(timestamp: number, timezoneOffset: number = 0): string {
  const date = new Date((timestamp + timezoneOffset) * 1000);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return `${days[date.getUTCDay()]} ${date.getUTCDate()}`;
}

/**
 * Format Unix timestamp to full day name (e.g., "Tuesday")
 */
export function formatDayFull(timestamp: number, timezoneOffset: number = 0): string {
  const date = new Date((timestamp + timezoneOffset) * 1000);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getUTCDay()];
}

/**
 * Format Unix timestamp to time string (e.g., "06:45")
 */
export function formatTime(timestamp: number, timezoneOffset: number = 0): string {
  const date = new Date((timestamp + timezoneOffset) * 1000);
  const hours = date.getUTCHours().toString().padStart(2, '0');
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Get date string for grouping (YYYY-MM-DD)
 */
export function getDateString(timestamp: number, timezoneOffset: number = 0): string {
  const date = new Date((timestamp + timezoneOffset) * 1000);
  return date.toISOString().split('T')[0];
}

/**
 * Check if timestamp is during daytime
 */
export function isDaytime(current: number, sunrise: number, sunset: number): boolean {
  return current >= sunrise && current < sunset;
}

/**
 * Capitalize first letter of each word
 */
export function capitalizeDescription(description: string): string {
  return description
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Convert wind speed from m/s to km/h
 */
export function msToKmh(ms: number): number {
  return Math.round(ms * 3.6);
}

/**
 * Get wind direction from degrees
 */
export function getWindDirection(degrees: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return directions[Math.round(degrees / 45) % 8];
}

/**
 * Format visibility (meters to km)
 */
export function formatVisibility(meters: number): string {
  const km = meters / 1000;
  return km >= 10 ? '10+ km' : `${km.toFixed(1)} km`;
}

// ============================================
// WEATHER ICON MAPPING
// ============================================

export type WeatherIconType =
  | 'clear-day'
  | 'clear-night'
  | 'partly-cloudy-day'
  | 'partly-cloudy-night'
  | 'cloudy'
  | 'overcast'
  | 'rain-light'
  | 'rain'
  | 'rain-heavy'
  | 'drizzle'
  | 'thunderstorm'
  | 'snow'
  | 'snow-heavy'
  | 'sleet'
  | 'fog'
  | 'mist'
  | 'wind';

/**
 * Map OpenWeather condition code to icon type
 * See: https://openweathermap.org/weather-conditions
 */
export function mapWeatherToIcon(conditionId: number, isDay: boolean = true): WeatherIconType {
  // Group 2xx: Thunderstorm
  if (conditionId >= 200 && conditionId < 300) {
    return 'thunderstorm';
  }

  // Group 3xx: Drizzle
  if (conditionId >= 300 && conditionId < 400) {
    return 'drizzle';
  }

  // Group 5xx: Rain
  if (conditionId >= 500 && conditionId < 600) {
    if (conditionId === 500) return 'rain-light';
    if (conditionId <= 501) return 'rain';
    return 'rain-heavy';
  }

  // Group 6xx: Snow
  if (conditionId >= 600 && conditionId < 700) {
    if (conditionId === 611 || conditionId === 612 || conditionId === 613 ||
        conditionId === 615 || conditionId === 616) {
      return 'sleet';
    }
    if (conditionId >= 602) return 'snow-heavy';
    return 'snow';
  }

  // Group 7xx: Atmosphere
  if (conditionId >= 700 && conditionId < 800) {
    if (conditionId === 701 || conditionId === 721) return 'mist';
    if (conditionId === 781) return 'wind'; // Tornado
    return 'fog';
  }

  // Group 800: Clear
  if (conditionId === 800) {
    return isDay ? 'clear-day' : 'clear-night';
  }

  // Group 80x: Clouds
  if (conditionId === 801 || conditionId === 802) {
    return isDay ? 'partly-cloudy-day' : 'partly-cloudy-night';
  }
  if (conditionId === 803) {
    return 'cloudy';
  }
  if (conditionId === 804) {
    return 'overcast';
  }

  // Default
  return isDay ? 'clear-day' : 'clear-night';
}

/**
 * Get background gradient based on weather and time of day
 */
export function getWeatherGradient(conditionId: number, isDay: boolean): string {
  if (conditionId >= 200 && conditionId < 300) {
    return 'from-slate-800 to-slate-900'; // Thunderstorm
  }
  if (conditionId >= 300 && conditionId < 600) {
    return 'from-slate-700 to-slate-800'; // Rain/Drizzle
  }
  if (conditionId >= 600 && conditionId < 700) {
    return 'from-slate-600 to-slate-700'; // Snow
  }
  if (conditionId >= 700 && conditionId < 800) {
    return 'from-gray-600 to-gray-700'; // Fog/Mist
  }
  if (conditionId === 800) {
    return isDay ? 'from-blue-600 to-cyan-700' : 'from-indigo-900 to-slate-900';
  }
  // Cloudy
  return isDay ? 'from-slate-600 to-slate-700' : 'from-slate-800 to-slate-900';
}
