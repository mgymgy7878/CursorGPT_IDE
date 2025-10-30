'use client';

import { useDensity } from '@/hooks/useDensity';
import { Minimize2, Maximize2 } from 'lucide-react';

/**
 * DensityToggle - Switch between compact and comfortable layouts
 *
 * Compact: Higher density, more content at-a-glance
 * Comfortable: More spacing, easier reading
 */
export default function DensityToggle() {
  const { density, setDensity } = useDensity();
  const isCompact = density === 'compact';

  return (
    <button
      onClick={() => setDensity(isCompact ? 'comfortable' : 'compact')}
      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-zinc-800 text-neutral-400 hover:text-neutral-200 transition-colors text-sm"
      title={isCompact ? 'Rahat görünüme geç' : 'Kompakt görünüme geç'}
      aria-label={isCompact ? 'Rahat görünüme geç' : 'Kompakt görünüme geç'}
    >
      {isCompact ? <Maximize2 className="size-4" /> : <Minimize2 className="size-4" />}
      <span className="text-xs">{isCompact ? 'Kompakt' : 'Rahat'}</span>
    </button>
  );
}

