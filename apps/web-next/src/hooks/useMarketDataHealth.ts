'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { fetchWithTimeout } from '@/lib/net/fetchWithTimeout';

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
      // fetchWithTimeout kullan (AbortController + setTimeout - daha öngörülebilir)
      const res = await fetchWithTimeout(url, { cache: 'no-store' }, 5000);
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

/**
 * P7: WS state mapping helper - tek kaynak, tutarlı mapping
 * wsConnected=true => CONNECTED
 * wsConnected=false && reconnects>0 => BACKOFF
 * wsConnected=false && reconnects==0 => DISCONNECTED
 * ageMs>30s ise "LONG" varyantı (DISCONNECTED-LONG) UI'da kırmızı, BACKOFF amber
 */
export function getWsState(health: MarketDataHealth): {
  state: 'CONNECTED' | 'BACKOFF' | 'DISCONNECTED' | 'DISCONNECTED-LONG';
  label: string;
  color: 'success' | 'warn' | 'danger';
} {
  if (health.wsConnected) {
    return {
      state: 'CONNECTED',
      label: 'CONNECTED',
      color: 'success',
    };
  }
  
  // reconnects > 0 ise BACKOFF (yeniden deneme devam ediyor)
  if (health.reconnects > 0) {
    return {
      state: 'BACKOFF',
      label: `BACKOFF (reconnects: ${health.reconnects})`,
      color: 'warn', // Amber
    };
  }
  
  // reconnects == 0 ve ageMs > 30s ise DISCONNECTED-LONG (kırmızı)
  if (health.ageMs > 30000) {
    return {
      state: 'DISCONNECTED-LONG',
      label: 'DISCONNECTED',
      color: 'danger', // Kırmızı
    };
  }
  
  // reconnects == 0 ve ageMs <= 30s ise DISCONNECTED (henüz kısa süre)
  return {
    state: 'DISCONNECTED',
    label: 'DISCONNECTED',
    color: 'warn', // Amber (henüz kısa süre)
  };
}
