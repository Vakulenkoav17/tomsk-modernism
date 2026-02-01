import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import tomskStreets from '../data/tomskStreets.json';

const normalizeStreetQuery = (value) => {
  return (value || '')
    .toLowerCase()
    .replace(/[.,]/g, ' ')
    .replace(
      /\b(\u0443\u043b\u0438\u0446\u0430|\u0443\u043b|\u043f\u0440\u043e\u0441\u043f\u0435\u043a\u0442|\u043f\u0440-?\u043a\u0442|\u043f\u0440|\u0431\u0443\u043b\u044c\u0432\u0430\u0440|\u0431\u0443\u043b|\u043f\u0435\u0440\u0435\u0443\u043b\u043e\u043a|\u043f\u0435\u0440|\u043f\u043b\u043e\u0449\u0430\u0434\u044c|\u043f\u043b|\u043d\u0430\u0431\u0435\u0440\u0435\u0436\u043d\u0430\u044f|\u043d\u0430\u0431|\u043f\u0440\u043e\u0435\u0437\u0434|\u0448\u043e\u0441\u0441\u0435|\u0448|\u0442\u0443\u043f\u0438\u043a|\u043c\u0438\u043a\u0440\u043e\u0440\u0430\u0439\u043e\u043d|\u043c\u043a\u0440|\u043a\u0432\u0430\u0440\u0442\u0430\u043b|\u043a\u0432)\b/gi,
      ' '
    )
    .replace(/\s+/g, ' ')
    .trim();
};

const stripStreetType = (value) => {
  return (value || '')
    .replace(
      /\b(\u0443\u043b\u0438\u0446\u0430|\u0443\u043b\.?|\u043f\u0440\u043e\u0441\u043f\u0435\u043a\u0442|\u043f\u0440-?\u043a\u0442|\u043f\u0440\.?|\u0431\u0443\u043b\u044c\u0432\u0430\u0440|\u0431\u0443\u043b\.?|\u043f\u0435\u0440\u0435\u0443\u043b\u043e\u043a|\u043f\u0435\u0440\.?|\u043f\u043b\u043e\u0449\u0430\u0434\u044c|\u043f\u043b\.?|\u043d\u0430\u0431\u0435\u0440\u0435\u0436\u043d\u0430\u044f|\u043d\u0430\u0431\.?|\u043f\u0440\u043e\u0435\u0437\u0434|\u0448\u043e\u0441\u0441\u0435|\u0448\.?|\u0442\u0443\u043f\u0438\u043a|\u043c\u0438\u043a\u0440\u043e\u0440\u0430\u0439\u043e\u043d|\u043c\u043a\u0440\.?|\u043a\u0432\u0430\u0440\u0442\u0430\u043b|\u043a\u0432\.?)\b/gi,
      ''
    )
    .replace(/\s+/g, ' ')
    .replace(/^[,.\s]+|[,.\s]+$/g, '')
    .trim();
};

const splitAddressQuery = (value) => {
  const trimmed = (value || '').trim();
  const match = trimmed.match(/^(.*?)(\d[\d/\-\u0430-\u044f\u0410-\u042f]*)\s*$/);
  if (match) {
    return {
      streetRaw: match[1].replace(/[,]+$/g, '').trim(),
      houseRaw: match[2].trim(),
    };
  }
  return {
    streetRaw: trimmed.replace(/[,]+$/g, '').trim(),
    houseRaw: '',
  };
};

const buildNominatimSuggestions = (data, stage, houseFilter) => {
  const results = Array.isArray(data) ? data : [];
  const seen = new Set();
  return results
    .map((item) => {
      const display = item?.display_name || '';
      const lowerDisplay = display.toLowerCase();
      if (!lowerDisplay.includes('\u0442\u043e\u043c\u0441\u043a') && !lowerDisplay.includes('tomsk')) return null;
      const addr = item.address || {};
      const house = addr.house_number || '';
      const streetRaw = addr.road || addr.pedestrian || addr.footway || addr.path || addr.street || display.split(',')[0];
      const street = streetRaw ? stripStreetType(streetRaw) || streetRaw : '';
      const hasHouse = house.length > 0;
      if (stage === 'street' && hasHouse) return null;
      if (stage === 'house' && !hasHouse) return null;
      if (stage === 'house' && houseFilter && !house.startsWith(houseFilter)) return null;
      const label = stage === 'house' ? `${street || streetRaw} ${house}`.trim() : street || streetRaw;
      if (!label || seen.has(label)) return null;
      seen.add(label);
      return {
        kind: stage === 'house' ? 'house' : 'street',
        label,
        value: stage === 'house' ? `${streetRaw} ${house}`.trim() : streetRaw,
        street: streetRaw,
        house,
      };
    })
    .filter(Boolean);
};

const fetchNominatimSuggestions = async (stage, streetPart, housePart, signal) => {
  const query = stage === 'house'
    ? `${streetPart} ${housePart}`.trim()
    : streetPart;
  if (!query) return [];
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=${stage === 'house' ? 30 : 10}&addressdetails=1&countrycodes=ru&accept-language=ru&q=${encodeURIComponent(query + ', Tomsk')}`;
  const response = await fetch(url, {
    signal,
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) return [];
  const data = await response.json();
  return buildNominatimSuggestions(data, stage, housePart);
};

const getLocalStreetSuggestions = (streetIndex, query, limit = 12) => {
  const normalizedQuery = normalizeStreetQuery(query);
  if (!normalizedQuery) return [];
  const matches = streetIndex.filter((item) => item.normalized.includes(normalizedQuery));
  matches.sort((a, b) => {
    const aStarts = a.normalized.startsWith(normalizedQuery);
    const bStarts = b.normalized.startsWith(normalizedQuery);
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;
    return a.normalized.length - b.normalized.length;
  });
  return matches.slice(0, limit).map((item) => ({
    kind: 'street',
    label: item.label,
    street: item.label,
  }));
};

const pickBestStreetLabel = (streetIndex, query) => {
  const normalizedQuery = normalizeStreetQuery(query);
  if (!normalizedQuery) return '';
  let best = null;
  for (const item of streetIndex) {
    if (!item.normalized.includes(normalizedQuery)) continue;
    if (!best) {
      best = item;
      continue;
    }
    const bestStarts = best.normalized.startsWith(normalizedQuery);
    const itemStarts = item.normalized.startsWith(normalizedQuery);
    if (itemStarts && !bestStarts) {
      best = item;
      continue;
    }
    if (itemStarts === bestStarts && item.normalized.length < best.normalized.length) {
      best = item;
    }
  }
  return best?.label || '';
};

export default function useAddressSuggestions({ value, setValue, onInputChange, onSelectFinal }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [stage, setStage] = useState('street');
  const [streetLabel, setStreetLabel] = useState('');
  const cacheRef = useRef(new Map());

  const streetIndex = useMemo(() => {
    return (tomskStreets || [])
      .map((label) => ({
        label,
        normalized: normalizeStreetQuery(label),
      }))
      .filter((item) => item.normalized);
  }, []);

  const handleInputChange = useCallback((eventOrValue) => {
    const next = typeof eventOrValue === 'string' ? eventOrValue : eventOrValue.target.value;
    setValue(next);
    if (onInputChange) onInputChange(next);

    const parsed = splitAddressQuery(next);
    if (parsed.houseRaw) {
      setStage('house');
      if (parsed.streetRaw) {
        setStreetLabel(pickBestStreetLabel(streetIndex, parsed.streetRaw) || parsed.streetRaw);
      }
    } else if (!streetLabel || !next.startsWith(streetLabel)) {
      setStage('street');
      setStreetLabel('');
    }
  }, [onInputChange, setValue, streetIndex, streetLabel]);

  const handleSelectSuggestion = useCallback((item) => {
    if (!item) return;
    if (item.kind === 'street') {
      setStreetLabel(item.street || item.label);
      setStage('house');
      setOpen(false);
      setActiveIndex(-1);
      setValue(`${item.street || item.label} `);
      return;
    }
    const fullAddress = item.street ? `${item.street} ${item.house}` : item.label;
    setValue(fullAddress || value);
    setOpen(false);
    setActiveIndex(-1);
    if (onSelectFinal) onSelectFinal();
  }, [onSelectFinal, setValue, value]);

  const handleSuggestionKeyDown = useCallback((e) => {
    if (!suggestions.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((activeIndex + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((activeIndex - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      handleSelectSuggestion(suggestions[activeIndex]);
    }
  }, [activeIndex, handleSelectSuggestion, suggestions]);

  const handleAddressKeyDown = useCallback((e, isLoadingOverride, isOpenOverride) => {
    const isLoading = typeof isLoadingOverride === 'boolean' ? isLoadingOverride : loading;
    const isOpen = typeof isOpenOverride === 'boolean' ? isOpenOverride : open;
    if (e.key === 'Enter' && (isLoading || isOpen)) {
      e.preventDefault();
    }
  }, [loading, open]);

  const handleFocus = useCallback(() => {
    if (suggestions.length > 0) setOpen(true);
  }, [suggestions.length]);

  const handleBlur = useCallback(() => {
    setTimeout(() => setOpen(false), 150);
  }, []);

  useEffect(() => {
    const query = (value || '').trim();
    if (query.length < 2) {
      setSuggestions([]);
      setOpen(false);
      setLoading(false);
      return;
    }

    const parsed = splitAddressQuery(query);
    const streetQueryRaw = parsed.streetRaw || query;
    const streetQuery = normalizeStreetQuery(streetQueryRaw) || streetQueryRaw;
    const inferredHouse = parsed.houseRaw;
    const nextStage = inferredHouse ? 'house' : stage;

    const controller = new AbortController();
    const run = async () => {
      try {
        setLoading(true);
        const housePart = inferredHouse || (nextStage === 'house'
          ? query.replace(streetLabel, '').replace(',', '').trim()
          : '');
        const cacheKey = `${nextStage}:${streetQuery}:${housePart}`;
        const cached = cacheRef.current.get(cacheKey);
        if (cached && Date.now() - cached.ts < 120000) {
          setSuggestions(cached.list);
          setOpen(cached.list.length > 0);
          setActiveIndex(cached.list.length > 0 ? 0 : -1);
          return;
        }

        const streetPart = streetLabel || pickBestStreetLabel(streetIndex, streetQueryRaw) || streetQueryRaw || query;
        const list = nextStage === 'street'
          ? getLocalStreetSuggestions(streetIndex, streetQueryRaw)
          : await fetchNominatimSuggestions(nextStage, streetPart, housePart, controller.signal);

        cacheRef.current.set(cacheKey, { ts: Date.now(), list });
        setSuggestions(list);
        setOpen(list.length > 0);
        setActiveIndex(list.length > 0 ? 0 : -1);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setSuggestions([]);
        }
      } finally {
        setLoading(false);
      }
    };

    const handle = setTimeout(run, 300);
    return () => {
      clearTimeout(handle);
      controller.abort();
    };
  }, [stage, streetLabel, streetIndex, value]);

  return {
    suggestions,
    loading,
    open,
    activeIndex,
    stage,
    streetLabel,
    setStreetLabel,
    setStage,
    setOpen,
    setActiveIndex,
    handleInputChange,
    handleSelectSuggestion,
    handleSuggestionKeyDown,
    handleAddressKeyDown,
    handleFocus,
    handleBlur,
  };
}
