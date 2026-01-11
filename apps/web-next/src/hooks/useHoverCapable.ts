/**
 * useHoverCapable - Hover capability detection hook (SSR-safe)
 *
 * Detects if the device supports hover (desktop + mouse).
 * Uses matchMedia with proper event listeners for Safari/old browsers.
 *
 * Returns true only if (hover: hover) and (pointer: fine) both match.
 */

'use client';

import { useEffect, useState } from 'react';

export function useHoverCapable(): boolean {
  const [capable, setCapable] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(hover: hover) and (pointer: fine)');

    const update = () => {
      setCapable(mediaQuery.matches);
    };

    // Initial check
    update();

    // Safari/old browser fallback
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', update);
    } else {
      // @ts-ignore - old Safari API
      mediaQuery.addListener(update);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', update);
      } else {
        // @ts-ignore - old Safari API
        mediaQuery.removeListener(update);
      }
    };
  }, []);

  return capable;
}

