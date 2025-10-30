'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Density = 'compact' | 'comfortable';

interface DensityState {
  density: Density;
  setDensity: (d: Density) => void;
}

/**
 * Density preference hook - persisted to localStorage
 *
 * Controls:
 * - Card heights (compact: 180px, comfortable: 220px)
 * - Padding (compact: pad-sm/md smaller)
 * - Table row height (compact: 36px, comfortable: 44px)
 *
 * Usage:
 * ```tsx
 * const { density, setDensity } = useDensity();
 * <body className={density === 'compact' ? 'd-compact' : 'd-comfortable'}>
 * ```
 */
export const useDensity = create<DensityState>()(
  persist(
    (set) => ({
      density: 'compact', // Default to compact for "at-a-glance"
      setDensity: (density) => set({ density }),
    }),
    {
      name: 'spark-density',
    }
  )
);

