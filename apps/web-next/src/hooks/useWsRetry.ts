'use client';

import { useEffect, useRef, useState } from 'react';
import { useMarketStore } from '@/stores/marketStore';

type RetryState = {
  attempt: number;
  nextRetryIn: number;
  isRetrying: boolean;
};

/**
 * WS Retry Hook - Exponential backoff with toast notifications
 *
 * Retry intervals: 1s → 2s → 5s → 10s → 30s (cap)
 * Shows toast when WS disconnects
 * Provides manual retry trigger
 */
export function useWsRetry() {
  const wsStatus = useMarketStore(s => s.status);
  const [retryState, setRetryState] = useState<RetryState>({
    attempt: 0,
    nextRetryIn: 0,
    isRetrying: false,
  });
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Calculate next retry delay (exponential backoff)
  const getRetryDelay = (attempt: number): number => {
    const delays = [1000, 2000, 5000, 10000, 30000]; // ms
    return delays[Math.min(attempt, delays.length - 1)];
  };

  // Manual retry trigger (just marks as retrying, actual WS reconnect handled by MarketProvider)
  const retryNow = () => {
    setRetryState({ attempt: 0, nextRetryIn: 0, isRetrying: true });
    // MarketProvider will automatically retry when status changes
    setTimeout(() => {
      setRetryState(prev => ({ ...prev, isRetrying: false }));
    }, 2000);
  };

  useEffect(() => {
    if (wsStatus === 'down' || wsStatus === 'degraded') {
      // Track retry attempt (actual reconnect handled by MarketProvider)
      const attempt = retryState.attempt;
      const delay = getRetryDelay(attempt);

      timeoutRef.current = setTimeout(() => {
        setRetryState(prev => ({
          attempt: prev.attempt + 1,
          nextRetryIn: 0,
          isRetrying: true,
        }));

        setTimeout(() => {
          setRetryState(prev => ({ ...prev, isRetrying: false }));
        }, 1000);
      }, delay);

      setRetryState(prev => ({ ...prev, nextRetryIn: delay }));
    } else if (wsStatus === 'healthy') {
      // Connected - reset retry state
      setRetryState({ attempt: 0, nextRetryIn: 0, isRetrying: false });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [wsStatus, retryState.attempt]);

  return {
    isDown: wsStatus === 'down',
    isDegraded: wsStatus === 'degraded',
    retryState,
    retryNow,
  };
}

