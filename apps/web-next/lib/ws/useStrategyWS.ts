'use client';
import { useEffect, useRef, useState } from 'react';

export type StreamMsg = { id: string; ts: number; pl: number };
export function useStrategyWS(url = process.env.NEXT_PUBLIC_EXECUTOR_WS_URL as string) {
  const [last, setLast] = useState<StreamMsg | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backoff = useRef(500);

  useEffect(() => {
    let alive: ReturnType<typeof setInterval> | null = null;

    const connect = () => {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        backoff.current = 500;
        if (alive) clearInterval(alive);
        alive = setInterval(() => ws.readyState === 1 && ws.send('ping'), 15000);
      };
      ws.onmessage = (e) => { try { setLast(JSON.parse(e.data) as StreamMsg); } catch {} };
      ws.onclose = () => {
        if (alive) clearInterval(alive);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(connect, backoff.current);
        backoff.current = Math.min(backoff.current * 2, 5000);
      };
      ws.onerror = () => ws.close();
    };

    connect();
    return () => {
      wsRef.current?.close();
      if (timer.current) clearTimeout(timer.current);
      if (alive) clearInterval(alive);
    };
  }, [url]);

  return last;
}


