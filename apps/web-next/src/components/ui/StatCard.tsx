/**
 * StatCard - Dashboard metric card primitive
 *
 * Figma parity: label + value + delta + sublabel
 */

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

export interface StatCardProps {
  label: string;
  value: string | number;
  delta?: {
    value: string | number;
    isPositive?: boolean;
  };
  sublabel?: string;
  className?: string;
}

export function StatCard({ label, value, delta, sublabel, className }: StatCardProps) {
  // Figma parity: "label → value → meta" şeklinde alt alta (value tek başına satır, altta meta satırı)
  return (
    <div className={cn('p-4 rounded-lg border border-neutral-800 bg-neutral-900/80', className)}>
      <div className="text-xs text-neutral-400 mb-1">{label}</div>
      {/* Value tek başına satır */}
      <div className="text-2xl font-semibold text-neutral-200 num-tight mb-1">{value}</div>
      {/* Meta satırı: delta veya sublabel (alt alta, çakışma yok) */}
      {(delta || sublabel) && (
        <div className="text-xs">
          {delta && (
            <div className={cn(
              'font-medium',
              delta.isPositive ? 'text-emerald-400' : 'text-red-400'
            )}>
              {delta.isPositive ? '+' : ''}{delta.value}
            </div>
          )}
          {sublabel && (
            <div className="text-neutral-500">{sublabel}</div>
          )}
        </div>
      )}
    </div>
  );
}

