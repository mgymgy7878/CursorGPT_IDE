/**
 * useSse - EventSource wrapper with reconnect and error handling
 *
 * Provides:
 * - Automatic reconnection with exponential backoff
 * - lastMessageAt timestamp for staleness detection
 * - onMessage/onError callbacks
 */

import { useEffect, useRef, useState, useCallback } from 'react';

export interface UseSseOptions {
  url: string;
  onMessage?: (event: MessageEvent) => void;
  onError?: (error: Event) => void;
  enabled?: boolean;
  reconnectDelay?: number;
  maxReconnectDelay?: number;
}

export interface UseSseResult {
  lastMessageAt: number | null;
  isConnected: boolean;
  error: Error | null;
  reconnect: () => void;
}

export function useSse({
  url,
  onMessage,
  onError,
  enabled = true,
  reconnectDelay = 1000,
  maxReconnectDelay = 30000,
}: UseSseOptions): UseSseResult {
  const [lastMessageAt, setLastMessageAt] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentDelayRef = useRef(reconnectDelay);

  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const connect = useCallback(() => {
    if (!enabled || eventSourceRef.current) return;

    try {
      const es = new EventSource(url);
      eventSourceRef.current = es;

      es.onopen = () => {
        setIsConnected(true);
        setError(null);
        currentDelayRef.current = reconnectDelay; // Reset delay on successful connect
      };

      es.onmessage = (event) => {
        setLastMessageAt(Date.now());
        onMessage?.(event);
      };

      es.onerror = (err) => {
        setIsConnected(false);
        setError(new Error('SSE connection error'));
        onError?.(err);

        // Reconnect with exponential backoff
        cleanup();
        currentDelayRef.current = Math.min(
          currentDelayRef.current * 2,
          maxReconnectDelay
        );
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, currentDelayRef.current);
      };
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create EventSource'));
      setIsConnected(false);
    }
  }, [url, enabled, onMessage, onError, reconnectDelay, maxReconnectDelay, cleanup]);

  const reconnect = useCallback(() => {
    cleanup();
    currentDelayRef.current = reconnectDelay;
    connect();
  }, [cleanup, reconnectDelay, connect]);

  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      cleanup();
    }

    return cleanup;
  }, [enabled, connect, cleanup]);

  return {
    lastMessageAt,
    isConnected,
    error,
    reconnect,
  };
}
