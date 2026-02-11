/**
 * useDeferredLocalStorageState - Hydration-safe localStorage state hook
 *
 * İlk render'da SADECE defaultValue kullanır (SSR ile aynı).
 * Mount sonrası localStorage'dan okur ve state'i günceller.
 * State değiştiğinde localStorage'a yazar.
 *
 * Bu sayede SSR HTML = Client ilk render HTML → Hydration uyumlu!
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

export function useDeferredLocalStorageState<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  // İlk render: SADECE defaultValue (SSR ile aynı)
  const [state, setState] = useState<T>(defaultValue);
  const [isHydrated, setIsHydrated] = useState(false);

  // Mount sonrası: localStorage'dan oku
  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) {
        const parsed = JSON.parse(stored) as T;
        setState(parsed);
      }
    } catch {
      // localStorage erişim hatası veya parse hatası - default ile devam
    }
    setIsHydrated(true);
  }, [key]);

  // State değiştiğinde localStorage'a yaz (hydrate olduktan sonra)
  useEffect(() => {
    if (!isHydrated) return;

    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // localStorage yazma hatası (quota aşımı vb.)
    }
  }, [key, state, isHydrated]);

  // Setter wrapper
  const setStateWrapper = useCallback((value: T | ((prev: T) => T)) => {
    setState(value);
  }, []);

  return [state, setStateWrapper];
}

