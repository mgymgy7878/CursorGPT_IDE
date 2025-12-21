/**
 * DeltaText - Price change indicator
 *
 * Figma parity: Positive (green) / Negative (red) delta with +/- prefix
 */

import { cn } from '@/lib/utils';

export interface DeltaTextProps {
  value: number | string;
  isPositive?: boolean;
  showSign?: boolean;
  className?: string;
}

export function DeltaText({ value, isPositive, showSign = true, className }: DeltaTextProps) {
  const numericValue = typeof value === 'string' ? parseFloat(value.replace(/[+%]/g, '')) : value;
  const isPos = isPositive ?? numericValue >= 0;
  const displayValue = typeof value === 'string' ? value : `${isPos && showSign ? '+' : ''}${value}%`;

  return (
    <span className={cn(
      'text-sm font-medium tabular-nums',
      isPos ? 'text-emerald-400' : 'text-red-400',
      className
    )}>
      {displayValue}
    </span>
  );
}

