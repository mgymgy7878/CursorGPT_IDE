/**
 * SystemHealthCard - System health metrics card
 *
 * Figma parity: 3-row system health (API Latency, Execution, Data Stream)
 */

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';
import { Surface } from './Surface';

export interface SystemHealthItem {
  label: string;
  value: string | ReactNode;
  status?: 'healthy' | 'degraded' | 'down';
}

export interface SystemHealthCardProps {
  title: string;
  items: SystemHealthItem[];
  className?: string;
}

export function SystemHealthCard({ title, items, className }: SystemHealthCardProps) {
  const statusColors = {
    healthy: 'text-emerald-400',
    degraded: 'text-amber-400',
    down: 'text-red-400',
  };

  return (
    <Surface variant="card" className={cn('p-4', className)}>
      <div className="flex items-center justify-between mb-3">
        {/* Figma parity: text-[13px] font-medium leading-none */}
        <div className="text-[13px] font-medium text-neutral-200 leading-none">{title}</div>
        {/* Figma parity: Sağ üstte yeşil status dot (ilk healthy item'ın status'una göre) */}
        {items[0]?.status === 'healthy' && (
          <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></div>
        )}
      </div>
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between text-[13px] leading-none">
            <span className="text-neutral-400 font-medium">{item.label}:</span>
            <span className={cn(
              'text-neutral-200 font-medium tabular-nums',
              item.status && statusColors[item.status]
            )}>
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </Surface>
  );
}

