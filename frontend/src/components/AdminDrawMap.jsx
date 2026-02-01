import { useCallback, useEffect, useRef } from 'react';
import { YMaps, Map, Polygon } from '@pbe/react-yandex-maps';

const YANDEX_API_KEY = import.meta.env.VITE_YANDEX_MAPS_API_KEY;

export default function AdminDrawMap({
  center,
  address,
  polygonCoords,
  onPolygonChange,
  onResolve,
  onResolveStart,
  onResolveEnd,
  resolveEnabled = true,
}) {
  const mapRef = useRef(null);
  const drawModeRef = useRef(false);
  const polygonRef = useRef(null);
  const lastAddressRef = useRef('');
  const lastGeometryRef = useRef('');
  const originalGeometryRef = useRef('');

  useEffect(() => {
    if (mapRef.current && center && center[0] && center[1]) {
      mapRef.current.setCenter(center, 17, { duration: 300 });
    }
  }, [center]);

  useEffect(() => {
    if (Array.isArray(polygonCoords) && polygonCoords.length >= 3) {
      lastGeometryRef.current = JSON.stringify(polygonCoords);
    } else {
      lastGeometryRef.current = '';
    }
  }, [polygonCoords]);

  const normalizePolygon = useCallback((geojson) => {
    if (!geojson) return null;
    if (geojson.type === 'Polygon' && geojson.coordinates?.length) {
      return geojson.coordinates[0].map(([lng, lat]) => [lat, lng]);
    }
    if (geojson.type === 'MultiPolygon' && geojson.coordinates?.length) {
      return geojson.coordinates[0][0].map(([lng, lat]) => [lat, lng]);
    }
    return null;
  }, []);

  const fetchBuildingOutline = useCallback(async (lat, lng) => {
    const overpassQuery = `[out:json];way["building"](around:40,${lat},${lng});out geom;`;
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: overpassQuery,
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (!data.elements || !data.elements.length) return null;
    const best = data.elements
      .filter((item) => Array.isArray(item.geometry) && item.geometry.length >= 3)
      .sort((a, b) => b.geometry.length - a.geometry.length)[0];
    if (!best || !best.geometry) return null;
    return best.geometry.map((point) => [point.lat, point.lon]);
  }, []);

  const resolveAddress = useCallback(async (rawAddress) => {
    const query = rawAddress.includes('Tomsk') ? rawAddress : `${rawAddress}, Tomsk`;
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&polygon_geojson=1&q=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return null;
    const results = await response.json();
    if (!Array.isArray(results) || results.length === 0) return null;
    const first = results[0];
    const lat = parseFloat(first.lat);
    const lng = parseFloat(first.lon);
    let polygon = normalizePolygon(first.geojson);
    if (!polygon) {
      polygon = await fetchBuildingOutline(lat, lng);
    }
    return { lat, lng, polygonCoords: polygon };
  }, [fetchBuildingOutline, normalizePolygon]);

  useEffect(() => {
    if (!resolveEnabled) return;
    if (!address || address.trim().length < 5) return;
    if (address === lastAddressRef.current) return;

    const handle = setTimeout(async () => {
      lastAddressRef.current = address;
      if (onResolveStart) onResolveStart();
      try {
        const resolved = await resolveAddress(address);
        if (!resolved) return;
        const { lat, lng, polygonCoords: resolvedPolygon } = resolved;
        if (mapRef.current && lat && lng) {
          mapRef.current.setCenter([lat, lng], 17, { duration: 300 });
        }
        if (resolvedPolygon && resolvedPolygon.length >= 3) {
          onPolygonChange(resolvedPolygon);
        }
        if (onResolve) {
          onResolve({ lat, lng, polygonCoords: resolvedPolygon || [] });
        }
      } catch {
        // ignore resolve errors
      } finally {
        if (onResolveEnd) onResolveEnd();
      }
    }, 600);

    return () => clearTimeout(handle);
  }, [address, resolveAddress, resolveEnabled, onPolygonChange, onResolve, onResolveStart, onResolveEnd]);

  const handleMapClick = (e) => {
    if (!drawModeRef.current) return;
    const coords = e.get('coords');
    const next = Array.isArray(polygonCoords) ? [...polygonCoords, coords] : [coords];
    onPolygonChange(next);
  };

  const handleEditStart = () => {
    if (Array.isArray(polygonCoords) && polygonCoords.length >= 3) {
      originalGeometryRef.current = JSON.stringify(polygonCoords);
    } else {
      originalGeometryRef.current = lastGeometryRef.current || '';
    }
    if (polygonRef.current?.editor) {
      polygonRef.current.editor.startEditing();
      drawModeRef.current = false;
      return;
    }
    drawModeRef.current = true;
  };

  const handleEditStop = () => {
    if (polygonRef.current?.editor) {
      polygonRef.current.editor.stopEditing();
    }
    drawModeRef.current = false;
  };

  const handleEditCancel = () => {
    drawModeRef.current = false;
    if (polygonRef.current?.editor) {
      polygonRef.current.editor.stopEditing();
    }
    const restoredSource = originalGeometryRef.current || lastGeometryRef.current;
    const restored = restoredSource ? JSON.parse(restoredSource) : [];
    onPolygonChange(restored);
  };

  const handleGeometryChange = () => {
    const coords = polygonRef.current?.geometry?.getCoordinates?.();
    if (coords && coords[0]) {
      const next = coords[0];
      const nextKey = JSON.stringify(next);
      if (nextKey === lastGeometryRef.current) return;
      lastGeometryRef.current = nextKey;
      onPolygonChange(next);
    }
  };

  const fillColor = 'rgba(255, 120, 60, 0.6)';
  const strokeColor = '#ff6b35';

  return (
    <div className="admin-map-wrapper">
      <div className="admin-map-controls">
        <div className="admin-map-actions">
          <button
            type="button"
            className="btn btn-small btn-icon btn-map"
            onClick={handleEditStart}
            aria-label="Редактировать контур"
          >
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path
                d="M4 14.5V16h1.5L15 6.5 13.5 5 4 14.5Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            className="btn btn-small btn-icon btn-map btn-map-ghost"
            onClick={handleEditCancel}
            aria-label="Отменить правку"
          >
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path
                d="M6 8a6 6 0 1 1-1 6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              <path
                d="M4.5 6.5h4v4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            className="btn btn-small btn-icon btn-map btn-map-success"
            onClick={handleEditStop}
            aria-label="Завершить правку"
          >
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path
                d="M4.5 10.5l3.2 3.2L15.5 6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      <YMaps query={{ apikey: YANDEX_API_KEY }}>
        <Map
          instanceRef={mapRef}
          defaultState={{
            center: center || [56.4866, 84.9719],
            zoom: 16,
          }}
          width="100%"
          height="100%"
          onClick={handleMapClick}
          options={{
            suppressMapOpenBlock: true,
          }}
        >
          {Array.isArray(polygonCoords) && polygonCoords.length >= 3 && (
            <Polygon
              instanceRef={polygonRef}
              geometry={[polygonCoords]}
              modules={['geoObject.addon.editor']}
              options={{
                fillColor,
                strokeColor,
                strokeWidth: 1,
                strokeOpacity: 0.8,
                draggable: false,
                clickable: false,
              }}
              onGeometryChange={handleGeometryChange}
            />
          )}
        </Map>
      </YMaps>
    </div>
  );
}
