// src/hooks/useSearch.js
import { useCallback, useState } from 'react';
import { useObjects } from './useObjects';
import { useArchitects } from './useArchitects';
import { useMosaics } from './useMosaics';

export function useSearch() {
  const [results, setResults] = useState([]);
  const { objects } = useObjects();
  const { architects } = useArchitects();
  const { mosaics } = useMosaics();

  const search = useCallback((query) => {
    const q = query.toLowerCase();
    const res = [];

    objects.forEach(obj => {
      if ((obj.name || '').toLowerCase().includes(q) || (obj.desc || '').toLowerCase().includes(q)) {
        res.push({ ...obj, type: 'Объект' });
      }
    });

    architects.forEach(arch => {
      if ((arch.name || '').toLowerCase().includes(q) || (arch.bio || '').toLowerCase().includes(q)) {
        res.push({ ...arch, type: 'Архитектор' });
      }
    });

    mosaics.forEach(mosaic => {
      if ((mosaic.name || '').toLowerCase().includes(q) || (mosaic.desc || '').toLowerCase().includes(q)) {
        res.push({ ...mosaic, type: 'Мозаика' });
      }
    });

    setResults(res);
  }, [architects, mosaics, objects]);

  const clearResults = useCallback(() => setResults([]), []);

  return { results, search, clearResults };
}
