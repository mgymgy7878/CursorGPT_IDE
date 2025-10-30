'use client';

import { useHeartbeat } from './useHeartbeat';
import { useWsHeartbeat } from './useWsHeartbeat';
import { useEngineHealth } from './useEngineHealth';

export type ServiceStatus = 'unknown' | 'up' | 'down';

export interface UnifiedStatus {
  api: ServiceStatus;
  ws: ServiceStatus;
  executor: ServiceStatus;
}

/**
 * Unified status hook - single source of truth for all service health indicators
 *
 * Returns consistent status across:
 * - Top status bar (StatusBar component)
 * - Dashboard status pills
 * - Page-specific health indicators
 *
 * Status flow:
 * - unknown: Initial 2-3s loading state (gray pulse)
 * - up: Service responding and healthy (green)
 * - down: Service error or timeout (red)
 */
export function useUnifiedStatus(): UnifiedStatus {
  const { data: apiData, error: apiError, isLoading: apiLoading } = useHeartbeat();
  const wsOk = useWsHeartbeat();
  const { ok: executorOk, isLoading: executorLoading } = useEngineHealth();

  // Check if we're in dev/mock mode
  const isDev = process.env.NEXT_PUBLIC_ENV === 'dev';
  const isMock = process.env.NEXT_PUBLIC_MOCK === '1';

  // Resolver: undefined → unknown, boolean → up/down
  const resolve = (loading: boolean, ok: boolean | undefined): ServiceStatus => {
    if (loading) return 'unknown';
    return ok ? 'up' : 'down';
  };

  // Special handling for WS in dev/mock mode
  const getWsStatus = (): ServiceStatus => {
    if (isDev || isMock) {
      // In dev/mock mode, show as "unknown" (gray) instead of red
      return 'unknown';
    }
    // In prod mode, use normal logic
    return resolve(false, wsOk);
  };

  return {
    api: resolve(apiLoading, !apiError && !!apiData),
    ws: getWsStatus(),
    executor: resolve(executorLoading, executorOk),
  };
}
