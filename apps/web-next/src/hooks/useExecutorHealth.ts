'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { classifyFetchError, type ClassifiedError } from '@/lib/errorClassifier'

/**
 * Executor service health check (port 4001)
 * Uses proxy endpoint to avoid CORS issues
 * P1: Meta tracking ekle (lastOkAt, lastTryAt, lastError, endpoint)
 */
export function useExecutorHealth() {
  const [meta, setMeta] = useState<{
    lastOkAt: number | null;
    lastTryAt: number | null;
    lastError: ClassifiedError | null;
    lastEndpoint: string | null;
  }>({
    lastOkAt: null,
    lastTryAt: null,
    lastError: null,
    lastEndpoint: null,
  });

  const { data, error } = useSWR(
    '/api/executor-healthz',
    async (url) => {
      const now = Date.now();
      setMeta(prev => ({ ...prev, lastTryAt: now, lastEndpoint: url }));

      try {
        const res = await fetch(url, {
          cache: 'no-store',
          signal: AbortSignal.timeout(2000) // 2s timeout
        })
        
        // P5.1: non-2xx throw ile classifier kesin çalışsın
        if (!res.ok) {
          const err: any = new Error(`HTTP ${res.status}`);
          err.response = res;
          const classifiedError = classifyFetchError(err, res);
          setMeta(prev => ({ ...prev, lastError: classifiedError }));
          throw err; // Throw yap ki catch bloğuna düşsün ve classifier kesin çalışsın
        }
        
        const json = await res.json();
        if (json.ok) {
          setMeta(prev => ({ ...prev, lastOkAt: now, lastError: null }));
          return { ok: true, latencyMs: json.latencyMs, data: json };
        } else {
          const classifiedError = classifyFetchError(new Error('Executor not ok'), null);
          setMeta(prev => ({ ...prev, lastError: classifiedError }));
          return null;
        }
      } catch (err: any) {
        const classifiedError = classifyFetchError(err, null);
        setMeta(prev => ({ ...prev, lastError: classifiedError }));
        return null;
      }
    },
    {
      refreshInterval: 5000, // 5s refresh
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  )

  const ok = !!data && !error;

  return {
    ok,
    error,
    isLoading: !data && !error,
    latencyMs: data?.latencyMs,
    data,
    // P1: Meta tracking
    meta: {
      lastOkAt: meta.lastOkAt,
      lastTryAt: meta.lastTryAt,
      lastError: meta.lastError,
      lastEndpoint: meta.lastEndpoint,
    },
  }
}

