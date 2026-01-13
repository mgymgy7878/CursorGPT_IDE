/**
 * PATCH K: Density Mode Hook
 *
 * Runtime density toggle (ultra/compact/comfort) with localStorage persist
 */

'use client';

import { useState, useEffect } from 'react';

export type DensityMode = 'ultra' | 'compact' | 'comfort';

const LS_DENSITY_KEY = 'spark:density';
const DEFAULT_DENSITY: DensityMode = 'ultra';

export function useDensityMode() {
  // İlk render: SADECE default (SSR ile aynı - hydration safe)
  const [density, setDensityState] = useState<DensityMode>(DEFAULT_DENSITY);
  const [isHydrated, setIsHydrated] = useState(false);

  // Mount sonrası: localStorage'dan oku
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_DENSITY_KEY);
      if (stored && (stored === 'ultra' || stored === 'compact' || stored === 'comfort')) {
        setDensityState(stored as DensityMode);
      }
    } catch {
      // localStorage erişim hatası - default ile devam
    }
    setIsHydrated(true);
  }, []);

  // State değiştiğinde localStorage'a yaz + data attribute güncelle
  useEffect(() => {
    if (!isHydrated) return;

    try {
      localStorage.setItem(LS_DENSITY_KEY, density);
    } catch {
      // localStorage yazma hatası (quota aşımı vb.)
    }

    // Root element'e data-density attribute ekle
    document.documentElement.dataset.density = density;
  }, [density, isHydrated]);

  // Setter
  const setDensity = (mode: DensityMode) => {
    setDensityState(mode);
  };

  return [density, setDensity] as const;
}

