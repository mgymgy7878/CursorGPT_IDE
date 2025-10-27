'use client';
import { useEffect, useState } from "react";

export function useNoStoreJson<T = any>(url: string, timeoutMs = 1500, refreshKey: any = 0) {
  const [data, setData] = useState<T | null>(null);
  const [healthy, setHealthy] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);

    (async () => {
      try {
        const res = await fetch(url + (url.includes('?') ? '&' : '?') + `t=${Date.now()}`, {
          cache: 'no-store' as any,
          signal: ctrl.signal,
        });
        const js = await res.json();
        if (cancelled) return;
        setData(js);
        setHealthy(res.ok && !(js?.degraded === true) && !(js?.ok === false));
      } catch {
        if (!cancelled) setHealthy(false);
      } finally {
        if (!cancelled) setLoading(false);
        clearTimeout(t);
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(t);
      ctrl.abort();
    };
  }, [url, timeoutMs, refreshKey]);

  return { data, healthy, loading };
} 