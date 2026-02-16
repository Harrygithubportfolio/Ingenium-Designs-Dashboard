'use client';

import { useEffect, useRef } from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';

interface Props {
  polyline: string;
  className?: string;
  interactive?: boolean;
}

/**
 * Decodes a Google Encoded Polyline string into [lng, lat] pairs (GeoJSON order).
 * Based on the Google Encoded Polyline Algorithm.
 */
function decodePolyline(encoded: string): [number, number][] {
  const coords: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    lat += result & 1 ? ~(result >> 1) : result >> 1;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    lng += result & 1 ? ~(result >> 1) : result >> 1;

    // GeoJSON order: [lng, lat]
    coords.push([lng / 1e5, lat / 1e5]);
  }

  return coords;
}

export default function RouteMap({ polyline, className = '', interactive = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!containerRef.current || !polyline || !token) return;

    let cancelled = false;

    (async () => {
      const mapboxgl = (await import('mapbox-gl')).default;

      if (cancelled || !containerRef.current) return;

      mapboxgl.accessToken = token;

      const coords = decodePolyline(polyline);
      if (coords.length === 0) return;

      // Calculate bounds
      let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
      for (const [lng, lat] of coords) {
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      }

      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        bounds: [[minLng, minLat], [maxLng, maxLat]] as mapboxgl.LngLatBoundsLike,
        fitBoundsOptions: { padding: 40 },
        interactive,
        attributionControl: false,
      });

      mapRef.current = map;

      map.on('load', () => {
        map.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: coords,
            },
          },
        });

        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#3b82f6',
            'line-width': 3,
            'line-opacity': 0.9,
          },
        });

        // Add start/end markers
        if (coords.length >= 2) {
          const startEl = document.createElement('div');
          startEl.className = 'w-3 h-3 rounded-full bg-green-500 border-2 border-white';
          new mapboxgl.Marker({ element: startEl })
            .setLngLat(coords[0])
            .addTo(map);

          const endEl = document.createElement('div');
          endEl.className = 'w-3 h-3 rounded-full bg-red-500 border-2 border-white';
          new mapboxgl.Marker({ element: endEl })
            .setLngLat(coords[coords.length - 1])
            .addTo(map);
        }
      });
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [polyline, interactive]);

  if (!polyline) {
    return (
      <div className={`bg-inner rounded-lg flex items-center justify-center text-dim text-xs ${className}`}>
        No route data
      </div>
    );
  }

  return <div ref={containerRef} className={`rounded-lg overflow-hidden ${className}`} />;
}
