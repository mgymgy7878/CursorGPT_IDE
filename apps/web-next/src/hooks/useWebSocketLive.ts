'use client';
import { useEffect, useState, useRef } from 'react';

type State = 'idle' | 'connecting' | 'connected' | 'disconnected';

export default function useWebSocketLive<T = any>(topic: string) {
  const [state, setState] = useState<State>('idle');
  const [data, setData] = useState<T | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const attemptRef = useRef(0);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_WS_URL || 'ws://127.0.0.1:4001/ws/live';

    function connect() {
      setState('connecting');
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setState('connected');
        attemptRef.current = 0;
        // Subscribe to topic
        ws.send(JSON.stringify({ type: 'subscribe', topics: [topic] }));
      };

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          
          // Handle pings
          if (msg.type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong' }));
            return;
          }
          
          // Handle topic data
          if (msg.type === topic) {
            setData(msg.data);
          }
        } catch (err) {
          console.error('[WS] Parse error:', err);
        }
      };

      ws.onclose = () => {
        setState('disconnected');
        attemptRef.current++;
        
        // Exponential backoff: 5s, 10s, 20s (max)
        const delay = Math.min(5000 * Math.pow(2, attemptRef.current - 1), 20000);
        
        console.log(`[WS] Reconnecting in ${delay}ms (attempt ${attemptRef.current})`);
        setTimeout(connect, delay);
      };

      ws.onerror = () => {
        console.error('[WS] Error, closing connection');
        ws.close();
      };
    }

    connect();

    return () => {
      wsRef.current?.close();
    };
  }, [topic]);

  return { state, data };
}

