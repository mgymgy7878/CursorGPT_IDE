/**
 * MarketStalenessBadge - Shows market data staleness status
 *
 * PATCH: Fallback config ile crash koruması
 */

import { cn } from '@/lib/utils';

export type StalenessKey = 'loading' | 'healthy' | 'degraded' | 'stale' | 'error' | 'mock' | 'unknown';

export interface MarketStalenessBadgeProps {
  status?: StalenessKey | string | null;
}

const CONFIG: Record<StalenessKey, { label: string; className: string }> = {
  loading: { label: 'Yükleniyor...', className: 'text-neutral-400' },
  healthy: { label: 'Canlı', className: 'text-emerald-400' },
  degraded: { label: 'Gecikmeli', className: 'text-amber-400' },
  stale: { label: 'Eski', className: 'text-red-400' },
  error: { label: 'Hata', className: 'text-red-500' },
  mock: { label: 'Mock', className: 'text-neutral-500' },
  unknown: { label: '—', className: 'text-neutral-500' },
};

function normalizeStatus(input?: string | null): StalenessKey {
  if (!input) return 'unknown';
  const normalized = input.toLowerCase().trim();
  // Direct match
  if (normalized in CONFIG) {
    return normalized as StalenessKey;
  }
  // Alias mapping
  const aliases: Record<string, StalenessKey> = {
    'warn': 'degraded',
    'warning': 'degraded',
    'ok': 'healthy',
    'fresh': 'healthy',
    'dead': 'error',
    'offline': 'error',
  };
  return aliases[normalized] || 'unknown';
}

export function MarketStalenessBadge({ status }: MarketStalenessBadgeProps) {
  const key = normalizeStatus(status);
  const config = CONFIG[key] ?? CONFIG.unknown;

  // Don't show badge for loading/unknown states (optional: can be enabled)
  if (key === 'loading' || key === 'unknown') {
    return null;
  }

  return (
    <span className={cn('text-xs font-medium', config.className)}>
      {config.label}
    </span>
  );
}
