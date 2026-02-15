import { NextResponse } from 'next/server';
import type { WeatherData, DailyForecast, WeatherCondition } from '@/lib/weather';
import { getDateString, formatDay } from '@/lib/weather';

// ============================================
// CONFIGURATION
// ============================================

const API_KEY = process.env.OPENWEATHER_API_KEY!;
const LAT = '53.9921';
const LON = '-1.5418';

const CURRENT_WEATHER_URL = 'https://api.openweathermap.org/data/2.5/weather';
const FORECAST_URL = 'https://api.openweathermap.org/data/2.5/forecast';

// Cache for 10 minutes
export const revalidate = 600;

// ============================================
// API RESPONSE TYPES
// ============================================

interface OpenWeatherCurrentResponse {
  coord: { lon: number; lat: number };
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
  };
  visibility: number;
  wind: {
    speed: number;
    deg: number;
    gust?: number;
  };
  clouds: { all: number };
  dt: number;
  sys: {
    country: string;
    sunrise: number;
    sunset: number;
  };
  timezone: number;
  name: string;
}

interface OpenWeatherForecastResponse {
  list: Array<{
    dt: number;
    main: {
      temp: number;
      feels_like: number;
      temp_min: number;
      temp_max: number;
      pressure: number;
      humidity: number;
    };
    weather: Array<{
      id: number;
      main: string;
      description: string;
      icon: string;
    }>;
    clouds: { all: number };
    wind: {
      speed: number;
      deg: number;
      gust?: number;
    };
    visibility: number;
    pop: number;
    dt_txt: string;
  }>;
  city: {
    name: string;
    country: string;
    timezone: number;
    sunrise: number;
    sunset: number;
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Group forecast entries by date and calculate daily summaries
 */
function aggregateDailyForecasts(
  forecastList: OpenWeatherForecastResponse['list'],
  timezoneOffset: number
): DailyForecast[] {
  const dailyMap = new Map<string, {
    temps: number[];
    conditions: WeatherCondition[];
    humidities: number[];
    pops: number[];
    timestamp: number;
  }>();

  // Group by date
  for (const entry of forecastList) {
    const dateStr = getDateString(entry.dt, timezoneOffset);

    if (!dailyMap.has(dateStr)) {
      dailyMap.set(dateStr, {
        temps: [],
        conditions: [],
        humidities: [],
        pops: [],
        timestamp: entry.dt,
      });
    }

    const dayData = dailyMap.get(dateStr)!;
    dayData.temps.push(entry.main.temp);
    dayData.conditions.push(entry.weather[0]);
    dayData.humidities.push(entry.main.humidity);
    dayData.pops.push(entry.pop);
  }

  // Convert to daily forecasts
  const dailyForecasts: DailyForecast[] = [];

  for (const [dateStr, data] of dailyMap) {
    // Find the most common weather condition (dominant)
    const conditionCounts = new Map<number, { count: number; condition: WeatherCondition }>();
    for (const condition of data.conditions) {
      const existing = conditionCounts.get(condition.id);
      if (existing) {
        existing.count++;
      } else {
        conditionCounts.set(condition.id, { count: 1, condition });
      }
    }

    let dominantCondition = data.conditions[0];
    let maxCount = 0;
    for (const { count, condition } of conditionCounts.values()) {
      if (count > maxCount) {
        maxCount = count;
        dominantCondition = condition;
      }
    }

    dailyForecasts.push({
      date: dateStr,
      day: formatDay(data.timestamp, timezoneOffset),
      temp_min: Math.round(Math.min(...data.temps)),
      temp_max: Math.round(Math.max(...data.temps)),
      weather: dominantCondition,
      humidity: Math.round(data.humidities.reduce((a, b) => a + b, 0) / data.humidities.length),
      pop: Math.max(...data.pops),
    });
  }

  // Return first 5 days
  return dailyForecasts.slice(0, 5);
}

// ============================================
// API ROUTE HANDLER
// ============================================

export async function GET() {
  try {
    // Build URLs
    const currentUrl = new URL(CURRENT_WEATHER_URL);
    currentUrl.searchParams.set('lat', LAT);
    currentUrl.searchParams.set('lon', LON);
    currentUrl.searchParams.set('units', 'metric');
    currentUrl.searchParams.set('appid', API_KEY);

    const forecastUrl = new URL(FORECAST_URL);
    forecastUrl.searchParams.set('lat', LAT);
    forecastUrl.searchParams.set('lon', LON);
    forecastUrl.searchParams.set('units', 'metric');
    forecastUrl.searchParams.set('appid', API_KEY);

    // Fetch both endpoints in parallel
    const [currentResponse, forecastResponse] = await Promise.all([
      fetch(currentUrl.toString(), { next: { revalidate: 600 } }),
      fetch(forecastUrl.toString(), { next: { revalidate: 600 } }),
    ]);

    // Check for errors
    if (!currentResponse.ok) {
      const errorText = await currentResponse.text();
      console.error('Current weather API error:', currentResponse.status, errorText);
      return NextResponse.json(
        { error: 'Failed to fetch current weather', details: errorText },
        { status: currentResponse.status }
      );
    }

    if (!forecastResponse.ok) {
      const errorText = await forecastResponse.text();
      console.error('Forecast API error:', forecastResponse.status, errorText);
      return NextResponse.json(
        { error: 'Failed to fetch forecast', details: errorText },
        { status: forecastResponse.status }
      );
    }

    // Parse responses
    const currentData: OpenWeatherCurrentResponse = await currentResponse.json();
    const forecastData: OpenWeatherForecastResponse = await forecastResponse.json();

    // Transform current weather
    const current = {
      temp: currentData.main.temp,
      feels_like: currentData.main.feels_like,
      temp_min: currentData.main.temp_min,
      temp_max: currentData.main.temp_max,
      humidity: currentData.main.humidity,
      pressure: currentData.main.pressure,
      visibility: currentData.visibility,
      wind_speed: currentData.wind.speed,
      wind_deg: currentData.wind.deg,
      clouds: currentData.clouds.all,
      sunrise: currentData.sys.sunrise,
      sunset: currentData.sys.sunset,
      weather: currentData.weather,
      location: currentData.name,
      country: currentData.sys.country,
    };

    // Transform hourly forecast (first 4 entries = next 12 hours @ 3-hour intervals)
    const hourly = forecastData.list.slice(0, 4).map((entry) => ({
      dt: entry.dt,
      temp: entry.main.temp,
      feels_like: entry.main.feels_like,
      humidity: entry.main.humidity,
      weather: entry.weather,
      pop: entry.pop,
      wind_speed: entry.wind.speed,
    }));

    // Aggregate daily forecasts
    const daily = aggregateDailyForecasts(forecastData.list, forecastData.city.timezone);

    // Build response
    const weatherData: WeatherData = {
      current,
      hourly,
      daily,
      timezone: currentData.timezone,
    };

    return NextResponse.json(weatherData, {
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
      },
    });
  } catch (error) {
    console.error('Weather API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
