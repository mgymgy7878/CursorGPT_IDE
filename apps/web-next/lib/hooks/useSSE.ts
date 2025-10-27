'use client';
import { useEffect, useRef, useState } from "react";

export function useSSE(url: string) {
  const [data, setData] = useState<any>(null);
  const [healthy, setHealthy] = useState(true);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    let cancelled = false;
    const connect = () => {
      if (cancelled) return;
      try {
        const es = new EventSource(url, { withCredentials: false });
        esRef.current = es;
        es.onmessage = (ev) => {
          try {
            const payload = JSON.parse(ev.data);
            setData(payload);
            setHealthy(!payload?.degraded && payload?.ok !== false);
          } catch {
            setHealthy(false);
          }
        };
        es.onerror = () => {
          setHealthy(false);
          es.close();
          setTimeout(connect, 1500);
        };
      } catch {
        setHealthy(false);
        setTimeout(connect, 1500);
      }
    };
    connect();
    return () => {
      cancelled = true;
      esRef.current?.close();
    };
  }, [url]);

  return { data, healthy };
} 