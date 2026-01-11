/**
 * RiskBar - Progress bar for risk metrics
 *
 * Figma parity: Daily Drawdown / Exposure progress bars
 */

import { cn } from '@/lib/utils';

export interface RiskBarProps {
  label: string;
  value: number; // 0-100
  threshold?: number;
  variant?: 'default' | 'warning' | 'danger';
  className?: string;
}

export function RiskBar({ label, value, threshold, variant = 'default', className }: RiskBarProps) {
  const colorClasses = {
    default: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
  };

  return (
    <div className={cn('space-y-1', className)}>
      {/* Figma parity: text-[11px] font-medium leading-none */}
      <div className="flex items-center justify-between text-[11px] font-medium leading-none">
        <span className="text-neutral-400">{label}</span>
        <span className="text-neutral-200 tabular-nums">{value}%</span>
      </div>
      <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
        <div
          className={cn('h-full transition-all', colorClasses[variant])}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
      {threshold !== undefined && (
        <div className="text-[11px] text-neutral-500 leading-none">Threshold: {threshold}%</div>
      )}
    </div>
  );
}

