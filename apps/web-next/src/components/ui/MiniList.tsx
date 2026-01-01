/**
 * MiniList - Compact list primitive for dashboard
 *
 * Figma parity: 3-row market status list
 */

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';
import { Surface } from './Surface';
import { cardHeader, bodyText, deltaText, sectionSpacing } from '@/styles/uiTokens';

export interface MiniListItem {
  label: string;
  value: string | number;
  delta?: {
    value: string | number;
    isPositive?: boolean;
  };
}

export interface MiniListProps {
  title: string;
  items: MiniListItem[];
  className?: string;
}

export function MiniList({ title, items, className }: MiniListProps) {
  // Helper: Format delta with parentheses (Figma parity)
  const formatDelta = (delta: { value: string | number; isPositive?: boolean }) => {
    const sign = delta.isPositive ? '+' : '−';
    const value = typeof delta.value === 'string' ? delta.value.replace(/^[+\-]/, '') : delta.value;
    return `(${sign}${value})`;
  };

  return (
    <Surface variant="card" className={cn('p-4', className)}>
      <div className={cn(cardHeader, "mb-3")}>{title}</div>
      <div className={sectionSpacing}>
        {items.map((item, idx) => (
          <div key={idx} className={cn("h-8 flex items-center justify-between gap-3 min-w-0", bodyText)}>
            {/* Sol: Symbol - min-w-0 ile taşma koruması */}
            <span className="text-neutral-300 leading-none min-w-0 truncate">{item.label}</span>
            {/* Sağ: Price + Delta tek grup (gap-2, min-w-0 ile hizalı, taşarsa truncate) */}
            <div className="flex items-center gap-2 min-w-0 shrink-0">
              <span className="text-white/80 tabular-nums leading-none whitespace-nowrap">{item.value}</span>
              {item.delta && (
                <span className={cn(
                  deltaText,
                  'whitespace-nowrap',
                  item.delta.isPositive ? 'text-emerald-400' : 'text-red-400'
                )}>
                  {formatDelta(item.delta)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </Surface>
  );
}

