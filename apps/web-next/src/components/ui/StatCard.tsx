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

  // Delta sign handling: Eğer value zaten + veya - içeriyorsa tekrar ekleme
  let deltaDisplay: string | null = null;
  if (delta) {
    const raw = String(delta.value).trim();
    const hasSign = raw.startsWith('+') || raw.startsWith('-');
    const sign = hasSign ? '' : (delta.isPositive ? '+' : '-');
    deltaDisplay = `${sign}${raw}`;
  }

  return (
    <div
      className={cn('min-w-0 w-full border bg-neutral-950/30 overflow-hidden', className)}
      style={{
        height: 'var(--metric-tile-h, 64px)',
        padding: 'var(--metric-tile-pad, 12px)',
        borderRadius: 'var(--card-radius, 12px)',
        borderWidth: 'var(--card-border-w, 1px)',
        borderColor: 'rgb(38 38 38)',
      }}
      data-testid="stat-card"
    >
      {/* Label: 11-12px Figma parity - truncate ile uzun etiketler kırpılır */}
      <div className="text-[11px] leading-tight text-neutral-400 mb-1 truncate">{label}</div>
      {/* Value: 20-24px Figma parity - clamp() ile responsive font size + overflow-safe */}
      <div className="font-semibold text-neutral-200 num-tight tabular-nums tracking-tight leading-none text-[clamp(20px,1.5vw,24px)] mb-1 whitespace-nowrap overflow-hidden text-ellipsis">
        {value}
      </div>
      {/* Meta satırı: delta veya sublabel (alt alta, çakışma yok) */}
      {(deltaDisplay || sublabel) && (
        <div className="text-[12px] leading-tight">
          {deltaDisplay && (
            <div className={cn(
              'font-medium whitespace-nowrap',
              delta!.isPositive ? 'text-emerald-400' : 'text-red-400'
            )}>
              {deltaDisplay}
            </div>
          )}
          {sublabel && (
            <div className="text-neutral-500 whitespace-nowrap">{sublabel}</div>
          )}
        </div>
      )}
    </div>
  );
}

