/**
 * DeltaText - Price change indicator
 *
 * Figma parity: Positive (green) / Negative (red) delta with +/- prefix
 * PATCH W.5: formatSignedPct kullanarak tutarlı format
 */

import { cn } from '@/lib/utils';
import { formatSignedPct } from '@/lib/format';

export interface DeltaTextProps {
  value: number | string;
  isPositive?: boolean;
  showSign?: boolean;
  className?: string;
}

export function DeltaText({ value, isPositive, showSign = true, className }: DeltaTextProps) {
  // PATCH W.5: formatSignedPct kullanarak tutarlı format
  let displayValue: string;
  let isPos: boolean;

  if (typeof value === 'string') {
    // String geliyorsa (örn: '+8.2%'), parse et ve formatSignedPct kullan
    const numericValue = parseFloat(value.replace(/[+%]/g, ''));
    const computedIsPos = Number.isFinite(numericValue) ? numericValue >= 0 : true;
    isPos = isPositive ?? computedIsPos;
    // PATCH W.5: formatSignedPct ile tutarlı format (input: 'pct' çünkü zaten % değeri)
    displayValue = !isNaN(numericValue) ? formatSignedPct(numericValue, { input: 'pct' }) : value;
  } else {
    // Number geliyorsa direkt formatSignedPct kullan
    isPos = isPositive ?? value >= 0;
    // PATCH W.5: formatSignedPct ile tutarlı format (input: 'pct' çünkü zaten % değeri)
    displayValue = formatSignedPct(value, { input: 'pct' });
  }

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

