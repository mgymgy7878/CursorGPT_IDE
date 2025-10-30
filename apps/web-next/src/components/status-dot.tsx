'use client'

import type { ServiceStatus } from '@/hooks/useUnifiedStatus';
import { useTranslation } from '@/hooks/useTranslation';

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
 * Erişilebilirlik: aria-hidden ile ekran okuyuculardan gizlenir
 * Ana durum mesajı StatusBar'da tek canlı bölge olarak sunulur
 *
 * Colors:
 * - unknown: gray pulse (loading/checking)
 * - up: green (healthy)
 * - down: red (error/offline)
 */
export function StatusDot({ status, ok, label }: StatusDotProps) {
  const t = useTranslation();
  
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

  // Tooltip için durum metni
  const getTooltipText = () => {
    if (!label) return undefined;

    if (finalStatus === 'unknown' && isDevMode) {
      return `${label}: ${t('service.dev_mode')} ${t('service.dev_mode_desc')}`;
    }

    const statusText = finalStatus === 'up' 
      ? t('status.online') 
      : finalStatus === 'down' 
        ? t('status.offline') 
        : t('status.checking');

    return `${label}: ${statusText}`;
  };

  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full ${color}`}
      aria-hidden="true"
      title={getTooltipText()}
      data-variant={variant}
      data-testid={label === t('service.ws') ? 'ws-badge' : undefined}
    />
  );
}

