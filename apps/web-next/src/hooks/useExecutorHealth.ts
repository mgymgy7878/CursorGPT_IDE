/**
 * useExecutorHealth - Check Executor service health status
 * Used to disable actions when Executor is unavailable
 *
 * Note: This is a new hook. Existing useExecutorHealth in status-bar.tsx
 * uses different endpoint (/api/executor-healthz). This one uses /api/health
 * for consistency with new health endpoint.
 */

'use client';

import { useState, useEffect } from 'react';

export interface ExecutorHealth {
  healthy: boolean;
  status: 'healthy' | 'degraded' | 'down';
  db: 'connected' | 'disconnected' | 'unknown';
  error?: string;
  requestId?: string;
  buildCommit?: string;
}

export function useExecutorHealth(): ExecutorHealth & { loading: boolean } {
  const [health, setHealth] = useState<ExecutorHealth>({
    healthy: false,
    status: 'down',
    db: 'unknown',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const checkHealth = async () => {
      try {
        // Try to fetch health endpoint (new /api/health)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
        }, 1500); // 1.5s timeout (degraded detection için)

        const startTime = Date.now();
        let res: Response;
        try {
          res = await fetch('/api/health', {
            cache: 'no-store',
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timeoutId);
        }

        if (cancelled) return;

        if (res && res.ok) {
          const data = await res.json();
          // Timeout'a yakın sürede yanıt gelirse 'degraded'
          const isSlow = Date.now() - startTime > 1000;
          setHealth({
            healthy: data.status === 'healthy' && !isSlow,
            status: isSlow ? 'degraded' : (data.status || 'down'),
            db: data.db || 'unknown',
            requestId: data.requestId,
            buildCommit: data.buildCommit,
          });
        } else {
          const data = res ? await res.json().catch(() => ({})) : {};
          setHealth({
            healthy: false,
            status: 'down',
            db: 'unknown',
            error: `HTTP ${res?.status || 'unknown'}`,
            requestId: data.requestId,
            buildCommit: data.buildCommit,
          });
        }
      } catch (e) {
        if (cancelled) return;
        // Timeout durumunda 'degraded', diğer hatalarda 'down'
        const isTimeout = e instanceof Error && e.name === 'AbortError';
        setHealth({
          healthy: false,
          status: isTimeout ? 'degraded' : 'down',
          db: 'unknown',
          error: e instanceof Error ? e.message : 'Connection failed',
        });
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    checkHealth();
    // Polling with jitter (8-12s ± 200ms)
    const baseInterval = 10000; // 10s base
    const jitter = () => Math.random() * 800 - 400; // ±400ms
    const scheduleNext = () => {
      const timeout = setTimeout(() => {
        if (!cancelled) {
          checkHealth();
          scheduleNext();
        }
      }, baseInterval + jitter());
      return timeout;
    };
    const timeoutId = scheduleNext();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, []);

  return { ...health, loading };
}
