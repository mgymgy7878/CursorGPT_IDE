'use client';

import { useEffect } from 'react';
import { useDensity } from '@/hooks/useDensity';

/**
 * DensityProvider - Applies density class to body element
 *
 * Wraps app to enable global density toggle
 */
export function DensityProvider({ children }: { children: React.ReactNode }) {
  const { density } = useDensity();

  useEffect(() => {
    // Apply density class to body
    document.body.classList.remove('d-compact', 'd-comfortable');
    document.body.classList.add(density === 'compact' ? 'd-compact' : 'd-comfortable');
  }, [density]);

  return <>{children}</>;
}

