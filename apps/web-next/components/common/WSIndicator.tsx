'use client';

import { useEffect, useRef, useState } from "react";

type Status = 'connecting' | 'open' | 'closed';

export default function WSIndicator() {
  const url = process.env.NEXT_PUBLIC_WS_URL || 'ws://127.0.0.1:4001/ws';
  const wsRef = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<Status>('connecting');
  const retryRef = useRef<number>(1000);

  useEffect(() => {
    let cancelled = false;
    const connect = () => {
      try {
        setStatus('connecting');
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
          if (cancelled) return;
          setStatus('open');
          retryRef.current = 1000;
        };
        ws.onclose = () => {
          if (cancelled) return;
          setStatus('closed');
          const next = Math.min(5000, retryRef.current * 2);
          retryRef.current = next;
          setTimeout(() => connect(), next);
        };
        ws.onerror = () => {
          try { ws.close(); } catch {}
        };
        // hafif heartbeat (opsiyonel)
        // ws.onmessage = (ev) => { /* no-op */ };
      } catch {
        setStatus('closed');
        const next = Math.min(5000, retryRef.current * 2);
        retryRef.current = next;
        setTimeout(() => connect(), next);
      }
    };
    connect();
    return () => {
      cancelled = true;
      try { wsRef.current?.close(); } catch {}
    };
  }, [url]);

  const dot =
    status === 'open' ? 'bg-emerald-500' :
    status === 'connecting' ? 'bg-amber-500 animate-pulse' :
    'bg-rose-500';

  return (
    <div className="flex items-center gap-2 text-xs text-zinc-400">
      <span className={`inline-block w-2 h-2 rounded-full ${dot}`} />
      <span>WS: {status}</span>
    </div>
  );
} 