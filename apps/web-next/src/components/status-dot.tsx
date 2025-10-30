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

  // Check if we're in dev/mock mode for special tooltip
  const isDev = process.env.NEXT_PUBLIC_ENV === 'dev';
  const isMock = process.env.NEXT_PUBLIC_MOCK === '1';
  const isDevMode = isDev || isMock;

  const colors: Record<ServiceStatus, string> = {
    unknown: 'bg-zinc-400 animate-pulse',
    up: 'bg-green-500',
    down: 'bg-red-500',
  };

  const color = colors[finalStatus];
  const variant = finalStatus === 'up' ? 'success' : finalStatus === 'down' ? 'error' : 'unknown';

  // Special tooltip for dev/mock mode
  const getAriaLabel = () => {
    if (!label) return undefined;

    if (finalStatus === 'unknown' && isDevMode) {
      return `${label}: Dev/Mock aktif — gerçek tick akışı yok`;
    }

    return `${label}: ${finalStatus === 'up' ? 'çevrimiçi' : finalStatus === 'down' ? 'çevrimdışı' : 'kontrol ediliyor'}`;
  };

  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full ${color}`}
      role="status"
      aria-label={getAriaLabel()}
      title={finalStatus === 'unknown' && isDevMode ? 'Dev/Mock aktif — gerçek tick akışı yok' : undefined}
      data-variant={variant}
      data-testid={label === 'WS' ? 'ws-badge' : undefined}
    />
  );
}

