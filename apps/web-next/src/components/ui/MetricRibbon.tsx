/**
 * MetricRibbon - Top mini metrics ribbon
 *
 * Figma parity: 3-6 KPI, single row, tabular numbers, small delta
 * Example: 7d PnL, Win Rate 30d, Sharpe 30d, Max DD, Open Positions, Risk Used
 */

import { cn } from '@/lib/utils';
import { MonoNumber } from './MonoNumber';
import { DeltaText } from './DeltaText';

export interface MetricRibbonItem {
  label: string;
  value: number | string;
  delta?: {
    value: number | string;
    isPositive?: boolean;
  };
  unit?: string;
}

export interface MetricRibbonProps {
  items: MetricRibbonItem[];
  className?: string;
}

export function MetricRibbon({ items, className }: MetricRibbonProps) {
  return (
    <div
      className={cn(
        'grid gap-2 px-4 py-3 bg-neutral-900/50 border border-neutral-800 rounded-lg',
        '[grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]',
        className
      )}
    >
      {items.map((item, index) => (
        <div key={index} className="min-w-0 overflow-hidden flex items-baseline gap-2">
          <div className="text-xs text-neutral-400 truncate shrink-0">{item.label}:</div>
          <div className="flex items-baseline gap-1.5 min-w-0 shrink-0">
            <MonoNumber value={item.value} className="text-sm font-semibold text-neutral-200 tabular-nums whitespace-nowrap" />
            {item.unit && <span className="text-xs text-neutral-400 shrink-0">{item.unit}</span>}
            {item.delta && (
              <DeltaText value={item.delta.value} isPositive={item.delta.isPositive} className="text-xs shrink-0" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

