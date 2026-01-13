'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';

export interface MarketDataHealth {
  lastMarketTickAt: number | null;
  ageMs: number;
  isStale: boolean;
  wsConnected: boolean;
  reconnects: number;
  rtDelayP95: number | null;
  source: 'mock' | 'binance' | 'btcturk' | 'unknown';
  status: 'healthy' | 'lagging' | 'stale' | 'disconnected';
}

/**
 * Hook to poll market data feed health metrics
 * Polls every 2-3 seconds to get real-time feed status
 */
export function useMarketDataHealth() {
  const { data, error, isLoading } = useSWR<MarketDataHealth>(
    '/api/marketdata/health',
    async (url) => {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`Health check failed: ${res.status}`);
      }
      return res.json();
    },
    {
      refreshInterval: 2500, // Poll every 2.5 seconds
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 1000, // Dedupe requests within 1s
    }
  );

  // Fallback to disconnected state if error or loading
  const health: MarketDataHealth = data || {
    lastMarketTickAt: null,
    ageMs: 0,
    isStale: true,
    wsConnected: false,
    reconnects: 0,
    rtDelayP95: null,
    source: 'unknown',
    status: 'disconnected',
  };

  return {
    health,
    isLoading,
    error,
  };
}

/**
 * Get human-readable feed status label
 */
export function getFeedStatusLabel(health: MarketDataHealth): string {
  if (health.status === 'disconnected') {
    return 'Disconnected';
  }
  if (health.status === 'stale') {
    return `Stale (${Math.floor(health.ageMs / 1000)}s)`;
  }
  if (health.status === 'lagging') {
    return `Lagging (${Math.floor(health.ageMs / 1000)}s)`;
  }
  return 'Healthy';
}

/**
 * Get feed status tone (for UI styling)
 */
export function getFeedStatusTone(health: MarketDataHealth): 'success' | 'warn' | 'danger' {
  if (health.status === 'healthy') return 'success';
  if (health.status === 'lagging') return 'warn';
  return 'danger'; // stale or disconnected
}
