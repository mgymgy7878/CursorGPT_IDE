/**
 * ChangeCell - Figma Parity Change Column
 *
 * Two-row layout:
 * - Top: Arrow icon + signed $ change (e.g., "$+1,024")
 * - Bottom: signed % change (e.g., "+2.4%")
 */

'use client';

import { cn } from '@/lib/utils';
import { formatSignedUsd, formatSignedPct } from '@/lib/format';

export interface ChangeCellProps {
  /** Absolute change in USD (e.g., 1024.50) */
  changeAbs: number;
  /** Percentage change (e.g., 2.4 for +2.4%) */
  changePct: number;
  className?: string;
}

export function ChangeCell({ changeAbs, changePct, className }: ChangeCellProps) {
  const isPositive = changePct >= 0;
  const isNeutral = changePct === 0;

  // PATCH W: Arrow icon smaller (10x10 instead of 12x12) for Figma parity
  const ArrowIcon = isPositive ? (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className="shrink-0">
      <path d="M6 2L10 6H7V10H5V6H2L6 2Z" fill="currentColor" />
    </svg>
  ) : (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className="shrink-0">
      <path d="M6 10L2 6H5V2H7V6H10L6 10Z" fill="currentColor" />
    </svg>
  );

  const colorClasses = isNeutral
    ? 'text-neutral-400'
    : isPositive
    ? 'text-emerald-400'
    : 'text-red-400';

  return (
    <div className={cn('flex flex-col items-end gap-1', className)}>
      {/* PATCH W: Top row - 12px font, tighter spacing */}
      <div className={cn('flex items-center gap-1 tabular-nums text-[12px] font-medium', colorClasses)}>
        {ArrowIcon}
        <span>{formatSignedUsd(changeAbs)}</span>
      </div>
      {/* PATCH W: Bottom row - 11px font, more muted */}
      <div className={cn('tabular-nums text-[11px] text-neutral-500', colorClasses)}>
        {formatSignedPct(changePct, { input: 'pct' })}
      </div>
    </div>
  );
}

