import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import useContainerSize from '../hooks/useContainerSize';
import { buildOptimizedImageUrl } from '../utils/cloudinary';
import { useNavigate, useLocation } from 'react-router-dom';
import { YMaps, Map, Polygon } from '@pbe/react-yandex-maps';
import { useObjects } from '../hooks/useObjects';
import { useMosaics } from '../hooks/useMosaics';
import { API_URL } from '../api/client';

const YANDEX_API_KEY = import.meta.env.VITE_YANDEX_MAPS_API_KEY;

const getPolygonCenter = (coords) => {
  if (!Array.isArray(coords) || coords.length === 0) return null;
  const sum = coords.reduce(
    (acc, [lat, lng]) => [acc[0] + lat, acc[1] + lng],
    [0, 0]
  );
  return [sum[0] / coords.length, sum[1] / coords.length];
};

const getMobilePanOffset = () => {
  if (typeof window === 'undefined') return 0;
  if (window.innerWidth > 480) return 0;
  const rawOffset = Math.round(window.innerHeight * 0.28);
  return Math.max(110, Math.min(240, rawOffset));
};

export default function MapPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const mapRef = useRef(null);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [loadedImageUrl, setLoadedImageUrl] = useState('');
  const [mapReady, setMapReady] = useState(false);
  const { ref: mapImageRef, width: mapImageWidth, height: mapImageHeight } = useContainerSize({ step: 100 });
  const { objects } = useObjects();
  const { mosaics } = useMosaics();

  const items = useMemo(() => {
    const objItems = (objects || [])
      .filter((o) => Array.isArray(o.polygonCoords) && o.polygonCoords.length >= 3)
      .map((o) => ({ ...o, type: 'object' }));
    const mosaicItems = (mosaics || [])
      .filter((m) => Array.isArray(m.polygonCoords) && m.polygonCoords.length >= 3)
      .map((m) => ({ ...m, type: 'mosaic' }));
    return [...objItems, ...mosaicItems];
  }, [objects, mosaics]);

  const focusFromLocation = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const focusId =
      params.get('focus') || location.state?.focusItemId || location.state?.focusObjectId;
    const focusType = location.state?.focusItemType;
    if (!focusId || items.length === 0) return null;
    return items.find((item) => {
      const sameId = String(item.id) === String(focusId);
      if (!sameId) return false;
      if (!focusType) return true;
      return item.type === focusType;
    }) || null;
  }, [items, location.search, location.state]);

  const selectedItem = useMemo(() => {
    if (selectedId && items.length > 0) {
      return (
        items.find((item) => {
          const sameId = String(item.id) === String(selectedId);
          if (!sameId) return false;
          if (!selectedType) return true;
          return item.type === selectedType;
        }) || null
      );
    }
    return focusFromLocation;
  }, [focusFromLocation, items, selectedId, selectedType]);

  const focusMap = useCallback((center, zoom) => {
    if (!mapRef.current || !center) return;
    const map = mapRef.current;
    const offset = getMobilePanOffset();
    const targetZoom = zoom ?? map.getZoom?.();
    let targetCenter = center;
    if (offset && map.options?.get && targetZoom !== undefined) {
      const projection = map.options.get('projection');
      if (projection?.toGlobalPixels && projection?.fromGlobalPixels) {
        const global = projection.toGlobalPixels(center, targetZoom);
        const shifted = [global[0], global[1] + offset];
        targetCenter = projection.fromGlobalPixels(shifted, targetZoom);
      }
    }
    map.setCenter(targetCenter, targetZoom, {
      duration: 450,
      checkZoomRange: true,
    });
  }, []);

  useEffect(() => {
    if (!selectedItem) return;
    if (!mapReady) return;
    const center =
      selectedItem.lat && selectedItem.lng
        ? [Number(selectedItem.lat), Number(selectedItem.lng)]
        : getPolygonCenter(selectedItem.polygonCoords);
    focusMap(center, 16);
  }, [focusMap, mapReady, selectedItem]);

  const getStrokeColor = (item) => {
    if (item.hasCard) return '#ff6b35';
    if (item.isUnique) return '#3a7bff';
    return '#9aa3ab';
  };

  const getFillColor = (item) => {
    if (item.hasCard) return 'rgba(255, 107, 53, 0.75)';
    if (item.isUnique) return 'rgba(58, 124, 255, 0.75)';
    return 'rgba(154, 163, 171, 0.35)';
  };

  const getTitle = (item) => {
    if (item.type === 'mosaic') return item.name || item.location;
    return item.name || item.address;
  };

  const getSubtitle = (item) => {
    if (item.type === 'mosaic') return item.location || '';
    return item.address || '';
  };

  const getDetailsPath = (item) => {
    if (item.type === 'mosaic') return `/mosaics/${item.id}`;
    return `/objects/${item.id}`;
  };

  const imageUrl = selectedItem?.image
    ? selectedItem.image.startsWith('http')
      ? selectedItem.image
      : `${API_URL}${selectedItem.image}`
    : null;

  const imageLoading = Boolean(imageUrl && loadedImageUrl !== imageUrl);

  const handleImageLoaded = () => {
    if (imageUrl) setLoadedImageUrl(imageUrl);
  };

  const focusParam = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('focus');
  }, [location.search]);

  const hasLocationFocus = Boolean(
    focusParam || location.state?.focusItemId || location.state?.focusObjectId
  );

  const clearLocationFocus = () => {
    const params = new URLSearchParams(location.search);
    params.delete('focus');
    const nextSearch = params.toString();
    navigate(nextSearch ? `/map?${nextSearch}` : '/map', { replace: true, state: null });
  };

  const handleClosePanel = () => {
    setSelectedId(null);
    setSelectedType(null);
    if (hasLocationFocus) {
      clearLocationFocus();
    }
  };

  const handlePolygonClick = (item) => {
    if (!item.hasCard) return;
    setSelectedId(item.id);
    setSelectedType(item.type);
    if (hasLocationFocus) {
      clearLocationFocus();
    }
  };

  return (
    <>
      <div className="map-container">
        <div className="map-fullscreen">
          <YMaps query={{ apikey: YANDEX_API_KEY }}>
            <Map
              instanceRef={mapRef}
              defaultState={{
                center: [56.4866, 84.9719],
                zoom: 14,
              }}
              width="100%"
              height="100%"
              options={{
                suppressMapOpenBlock: true,
                controls: [],
              }}
              onLoad={() => setMapReady(true)}
            >
              {items.map((item) => (
                <Polygon
                  key={`${item.type}-${item.id}`}
                  geometry={[item.polygonCoords]}
                  options={{
                    fillColor: getFillColor(item),
                    strokeColor: getStrokeColor(item),
                    strokeWidth: 2,
                    strokeOpacity: 0.9,
                    cursor: item.hasCard ? 'pointer' : 'default',
                    clickable: !!item.hasCard,
                    pane: 'areas',
                  }}
                  onClick={() => handlePolygonClick(item)}
                />
              ))}
            </Map>
          </YMaps>
        </div>

        {selectedItem && (
          <div className="map-object-panel">
            <div className="map-object-card">
              <button className="map-close-btn" onClick={handleClosePanel}>
                ×
              </button>
              <div
                className={`map-object-image ${imageLoading ? 'skeleton-block' : ''}`}
                ref={mapImageRef}
              >
                {imageUrl ? (
                  <img
                    src={buildOptimizedImageUrl(imageUrl, mapImageWidth, mapImageHeight, "fill")}
                    alt={getTitle(selectedItem)}
                    loading="lazy"
                    decoding="async"
                    className={imageLoading ? 'is-loading' : ''}
                    onLoad={handleImageLoaded}
                    onError={handleImageLoaded}
                  />
                ) : (
                  <div className="image-placeholder">Нет изображения</div>
                )}
              </div>
              <div className="map-object-info">
                {imageLoading ? (
                  <div className="map-object-skeleton" aria-hidden="true">
                    <div className="skeleton-line skeleton-line--title" />
                    <div className="skeleton-line skeleton-line--meta" />
                    <div className="skeleton-line skeleton-line--body" />
                    <div className="skeleton-line skeleton-line--body" />
                    <div className="skeleton-line map-skeleton-button" />
                  </div>
                ) : (
                  <>
                    <h3>{getTitle(selectedItem)}</h3>
                    {getSubtitle(selectedItem) && <p className="address">{getSubtitle(selectedItem)}</p>}
                    {selectedItem.desc && <p className="desc">{selectedItem.desc}</p>}
                    <button className="btn btn-primary" onClick={() => navigate(getDetailsPath(selectedItem))}>
                      Подробнее
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
