import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.OPENWEATHER_API_KEY!;
const DIRECT_URL = 'https://api.openweathermap.org/geo/1.0/direct';
const REVERSE_URL = 'https://api.openweathermap.org/geo/1.0/reverse';

interface GeoResult {
  name: string;
  state?: string;
  country: string;
  lat: number;
  lon: number;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const query = searchParams.get('q');
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  try {
    let url: URL;

    if (query) {
      // Forward geocode: city name → coordinates
      url = new URL(DIRECT_URL);
      url.searchParams.set('q', query);
      url.searchParams.set('limit', '5');
      url.searchParams.set('appid', API_KEY);
    } else if (lat && lon) {
      // Reverse geocode: coordinates → city name
      url = new URL(REVERSE_URL);
      url.searchParams.set('lat', lat);
      url.searchParams.set('lon', lon);
      url.searchParams.set('limit', '1');
      url.searchParams.set('appid', API_KEY);
    } else {
      return NextResponse.json(
        { error: 'Provide either ?q=city or ?lat=...&lon=...' },
        { status: 400 },
      );
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: 'Geocoding API error', details: errorText },
        { status: response.status },
      );
    }

    const raw = await response.json();

    const results: GeoResult[] = raw.map(
      (item: { name: string; state?: string; country: string; lat: number; lon: number }) => ({
        name: item.name,
        state: item.state,
        country: item.country,
        lat: item.lat,
        lon: item.lon,
      }),
    );

    return NextResponse.json(results);
  } catch (error) {
    console.error('Geocode API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
