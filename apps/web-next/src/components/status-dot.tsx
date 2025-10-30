'use client'

import type { ServiceStatus } from '@/hooks/useUnifiedStatus';

interface StatusDotProps {
  /** Service status - unified across all indicators */
  status?: ServiceStatus;
  /** @deprecated Use status instead */
  ok?: boolean;
  /** Optional label for accessibility */
  label?: string;
}

/**
 * StatusDot - Unified status indicator
 *
 * Colors:
 * - unknown: gray pulse (loading/checking)
 * - up: green (healthy)
 * - down: red (error/offline)
 */
export function StatusDot({ status, ok, label }: StatusDotProps) {
  // Backward compatibility: ok boolean → status
  const finalStatus: ServiceStatus = status ?? (ok === undefined ? 'unknown' : ok ? 'up' : 'down');

  const colors: Record<ServiceStatus, string> = {
    unknown: 'bg-zinc-400 animate-pulse',
    up: 'bg-green-500',
    down: 'bg-red-500',
  };

  const color = colors[finalStatus];
  const ariaLabel = label ? `${label}: ${finalStatus === 'up' ? 'çevrimiçi' : finalStatus === 'down' ? 'çevrimdışı' : 'kontrol ediliyor'}` : undefined;

  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full ${color}`}
      role="status"
      aria-label={ariaLabel}
    />
  );
}

