/**
 * useLiveStatus - StatusBar için canlı sistem durumu hook'u
 *
 * SWR ile /api/live/status endpoint'ini poll eder
 * Returns: { api, feed, executor, metrics }
 */

import useSWR from 'swr';

export interface LiveStatus {
  api: { ok: boolean };
  feed: { ok: boolean; stalenessSec?: number };
  executor: { ok: boolean; latencyMs?: number };
  metrics: {
    p95Ms: number | null;
    rtDelayMs: number | null;
    tradeCount: number | null;
    volumeUsd: string | null;
    alerts: {
      active: number;
      total: number;
      todayTriggered: number;
    } | null;
  };
}

const fetcher = async (url: string): Promise<LiveStatus> => {
  const res = await fetch(url, {
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch live status: ${res.statusText}`);
  }
  return res.json();
};

export function useLiveStatus() {
  const { data, error, isLoading } = useSWR<LiveStatus>(
    '/api/live/status',
    fetcher,
    {
      refreshInterval: 2000, // 2 saniyede bir poll
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      shouldRetryOnError: true,
      errorRetryCount: 3,
    }
  );

  return {
    status: data,
    isLoading,
    error: error || undefined,
  };
}
