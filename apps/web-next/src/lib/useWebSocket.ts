import { useEffect, useRef, useState } from 'react';

export interface WebSocketMessage {
  topic: string;
  payload: any;
  timestamp?: number;
}

interface UseWebSocketOptions {
  topics: string[];
  reconnect?: boolean;
  maxBackoff?: number;
}

interface UseWebSocketReturn {
  connected: boolean;
  message: WebSocketMessage | null;
  error: Error | null;
  send: (data: any) => void;
}

/**
 * WebSocket hook with auto-reconnect and exponential backoff
 * 
 * @example
 * const { connected, message } = useWebSocket('ws://localhost:4001/ws', {
 *   topics: ['marketData', 'strategyUpdates']
 * });
 */
export function useWebSocket(
  url: string,
  options: UseWebSocketOptions
): UseWebSocketReturn {
  const { topics, reconnect = true, maxBackoff = 15000 } = options;
  
  const wsRef = useRef<WebSocket | null>(null);
  const backoffRef = useRef(1000);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  
  const [connected, setConnected] = useState(false);
  const [message, setMessage] = useState<WebSocketMessage | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    const connect = () => {
      if (cancelled) return;
      
      try {
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
          if (cancelled) return;
          
          console.log('[WS] Connected to', url);
          setConnected(true);
          setError(null);
          backoffRef.current = 1000; // Reset backoff on successful connection

          // Subscribe to topics
          if (topics.length > 0) {
            ws.send(JSON.stringify({ 
              type: 'subscribe', 
              topics 
            }));
          }
        };

        ws.onmessage = (event) => {
          if (cancelled) return;
          
          try {
            const data = JSON.parse(event.data);
            
            // Filter by topic if topics are specified
            if (topics.length > 0 && (!data.topic || !topics.includes(data.topic))) {
              return;
            }
            
            setMessage({
              topic: data.topic || 'unknown',
              payload: data.payload || data,
              timestamp: Date.now()
            });
          } catch (err) {
            console.error('[WS] Failed to parse message:', err);
          }
        };

        ws.onclose = (event) => {
          if (cancelled) return;
          
          console.log('[WS] Connection closed:', event.code, event.reason);
          setConnected(false);

          // Attempt reconnect if enabled
          if (reconnect) {
            const backoff = backoffRef.current;
            console.log(`[WS] Reconnecting in ${backoff}ms...`);
            
            reconnectTimeoutRef.current = setTimeout(() => {
              connect();
            }, backoff);

            // Exponential backoff
            backoffRef.current = Math.min(backoffRef.current * 2, maxBackoff);
          }
        };

        ws.onerror = (event) => {
          if (cancelled) return;
          
          console.error('[WS] Error:', event);
          setError(new Error('WebSocket connection error'));
          ws.close();
        };
      } catch (err) {
        console.error('[WS] Failed to create WebSocket:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      }
    };

    connect();

    // Cleanup
    return () => {
      cancelled = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [url, JSON.stringify(topics), reconnect, maxBackoff]);

  const send = (data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    } else {
      console.warn('[WS] Cannot send message - WebSocket not connected');
    }
  };

  return { connected, message, error, send };
}

