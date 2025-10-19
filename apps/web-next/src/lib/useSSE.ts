/**
 * useSSE Hook - Server-Sent Events
 * Auto-reconnect EventSource with throttling
 */

import { useEffect, useState, useCallback, useRef } from 'react';

export interface SSEOptions {
  timeout?: number;
  throttle?: number;
  reconnectDelay?: number;
  maxReconnects?: number;
}

export interface SSEState<T> {
  data: T | null;
  error: string | null;
  isConnected: boolean;
  reconnects: number;
}

const DEFAULT_OPTIONS: Required<SSEOptions> = {
  timeout: 1200,
  throttle: 250,
  reconnectDelay: 2000,
  maxReconnects: 5,
};

export function useSSE<T>(url: string, options: SSEOptions = {}): SSEState<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  const [state, setState] = useState<SSEState<T>>({
    data: null,
    error: null,
    isConnected: false,
    reconnects: 0,
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<any>(null);
  const lastMessageTimeRef = useRef<number>(0);
  const reconnectCountRef = useRef<number>(0);

  const connect = useCallback(() => {
    if (eventSourceRef.current?.readyState === EventSource.OPEN) {
      return;
    }

    try {
      const es = new EventSource(url);

      es.onopen = () => {
        setState(prev => ({ ...prev, isConnected: true, error: null }));
        reconnectCountRef.current = 0;
      };

      es.onmessage = (event) => {
        const now = Date.now();
        
        // Throttle messages
        if (now - lastMessageTimeRef.current < opts.throttle) {
          return;
        }

        try {
          const parsed = JSON.parse(event.data);
          
          if (parsed.type === 'ticker' && parsed.data) {
            setState(prev => ({
              ...prev,
              data: parsed.data as T,
              error: null,
            }));
            lastMessageTimeRef.current = now;
          }
        } catch (err) {
          console.error('[useSSE] Parse error:', err);
        }
      };

      es.onerror = () => {
        es.close();
        setState(prev => ({ ...prev, isConnected: false }));
        
        // Schedule reconnect
        if (reconnectCountRef.current < opts.maxReconnects) {
          reconnectCountRef.current++;
          setState(prev => ({ ...prev, reconnects: reconnectCountRef.current }));
          
          reconnectTimerRef.current = setTimeout(() => {
            connect();
          }, opts.reconnectDelay);
        } else {
          setState(prev => ({
            ...prev,
            error: 'Max reconnects reached',
          }));
        }
      };

      eventSourceRef.current = es;
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Connection failed',
        isConnected: false,
      }));
    }
  }, [url, opts.throttle, opts.reconnectDelay, opts.maxReconnects]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [connect]);

  return state;
}

