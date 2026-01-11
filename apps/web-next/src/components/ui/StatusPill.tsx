/**
 * StatusPill - Small status capsule
 *
 * Figma parity: Feed: Healthy / Broker: Offline / Env: Mock
 */

import { cn } from '@/lib/utils';

export interface StatusPillProps {
  label: string;
  value: string;
  tone?: 'success' | 'warn' | 'error' | 'info' | 'muted';
  className?: string;
}

export function StatusPill({ label, value, tone = 'muted', className }: StatusPillProps) {
  const toneClasses = {
    success: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300',
    warn: 'bg-amber-500/20 border-amber-500/30 text-amber-300',
    error: 'bg-red-500/20 border-red-500/30 text-red-300',
    info: 'bg-blue-500/20 border-blue-500/30 text-blue-300',
    muted: 'bg-neutral-500/20 border-neutral-500/30 text-neutral-400',
  };

  return (
    <div className={cn('inline-flex items-center gap-1.5 px-2 py-1 rounded border text-xs', toneClasses[tone], className)}>
      <span className="font-medium">{label}:</span>
      <span>{value}</span>
    </div>
  );
}

