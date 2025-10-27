// apps/web-next/src/hooks/useTimeseries.ts
"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Getter<T> = (payload: any) => T;

export function useTimeseries<T>({
  url,
  getter,
  intervalMs = 10_000,
  maxPoints = 120,
  persistKey,
}: {
  url: string;
  getter: Getter<T>;
  intervalMs?: number;
  maxPoints?: number;
  persistKey?: string;
}) {
  const [points, setPoints] = useState<{ t: number; v: T }[]>(() => {
    if (!persistKey) return [];
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(persistKey) : null;
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let disposed = false;

    async function tick() {
      try {
        const r = await fetch(url, { cache: "no-store" });
        const json = await r.json();
        if (disposed) return;
        const v = getter(json);
        const next = [...points, { t: Date.now(), v }].slice(-maxPoints);
        setPoints(next);
        if (persistKey) {
          try { localStorage.setItem(persistKey, JSON.stringify(next)); } catch {}
        }
      } catch {
        // ignore errors; keep last points
      }
    }

    // initial fetch immediately
    tick();

    timer.current = setInterval(tick, intervalMs);
    return () => {
      disposed = true;
      if (timer.current) clearInterval(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, intervalMs, maxPoints]);

  const latest = points.at(-1)?.v;
  const prev = points.length > 1 ? points.at(-2)?.v : undefined;

  const delta = useMemo(() => {
    if (latest == null || prev == null) return undefined;
    if (typeof latest === "number" && typeof prev === "number") return latest - prev;
    return undefined;
  }, [latest, prev]);

  return { points, latest, delta };
}
