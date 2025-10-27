'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

export type SSEQuality = {
  status: 'GREEN' | 'YELLOW' | 'RED';
  eps: number;                 // events / second (rolling)
  p95GapMs: number;            // p95 inter-event gap (ms)
  lastEventAgeMs: number;      // time since last event
  disconnects: number;         // onerror sayacı (rolling)
  reconnects: number;          // basic reconnect tahmini
  openDurationMs: number;      // current session open süresi
  windowMs: number;            // ölçüm penceresi
};

type Opts = {
  windowMs?: number;           // default: 30_000
  staleMs?: number;            // default: 5_000 (stale kabul eşiği)
};

function p95(arr: number[]) {
  if (arr.length === 0) return Number.POSITIVE_INFINITY;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor(0.95 * (sorted.length - 1)));
  return sorted[idx];
}

export function useSSEQuality(url: string, opts: Opts = {}): SSEQuality {
  const windowMs = opts.windowMs ?? 30_000;
  const staleMs = opts.staleMs ?? 5_000;

  const [disconnects, setDisconnects] = useState(0);
  const [reconnects, setReconnects] = useState(0);
  const [lastEventTs, setLastEventTs] = useState<number>(0);
  const [openAt, setOpenAt] = useState<number>(0);
  const bufRef = useRef<number[]>([]); // timestamps
  const srcRef = useRef<EventSource | null>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    const src = new EventSource(url, { withCredentials: false });
    srcRef.current = src;
    setOpenAt(Date.now());

    const onMsg = () => {
      const now = Date.now();
      setLastEventTs(now);
      // buffer güncelle
      const buf = bufRef.current;
      buf.push(now);
      // pencere dışını at
      const cutoff = now - windowMs;
      while (buf.length && buf[0] < cutoff) buf.shift();
    };
    const onOpen = () => {
      // readyState=1
      if (wasOpen.current) {
        setReconnects((x) => x + 1);
      } else {
        wasOpen.current = true;
      }
    };
    const onErr = () => {
      // EventSource otomatik reconnect dener; onerror say
      setDisconnects((x) => x + 1);
    };

    src.addEventListener('message', onMsg);
    src.addEventListener('open', onOpen);
    src.addEventListener('error', onErr);

    return () => {
      try { src.close(); } catch {}
      srcRef.current = null;
    };
  }, [url, windowMs]);

  const now = useNow(1000); // 1s tick

  const { eps, p95GapMs, lastEventAgeMs, openDurationMs, status } = useMemo(() => {
    const nowTs = now;
    const buf = bufRef.current;
    // EPS
    const cutoff = nowTs - windowMs;
    const eventsInWindow = buf.filter((t) => t >= cutoff);
    const eps = eventsInWindow.length / (windowMs / 1000);

    // gaps
    let p95Gap = Number.POSITIVE_INFINITY;
    if (eventsInWindow.length >= 2) {
      const gaps: number[] = [];
      for (let i = 1; i < eventsInWindow.length; i++) {
        gaps.push(eventsInWindow[i] - eventsInWindow[i - 1]);
      }
      p95Gap = p95(gaps);
    }

    const lastAge = lastEventTs ? nowTs - lastEventTs : Number.POSITIVE_INFINITY;
    const openDur = openAt ? nowTs - openAt : 0;

    // Basit durum şeması:
    // GREEN: eps >= 1.0 ve p95Gap <= 1500ms ve lastAge <= staleMs
    // YELLOW: eps >= 0.5 ve p95Gap <= 3000ms
    // RED: diğerleri
    let status: SSEQuality['status'] = 'RED';
    if (eps >= 1 && p95Gap <= 1500 && lastAge <= staleMs) status = 'GREEN';
    else if (eps >= 0.5 && p95Gap <= 3000) status = 'YELLOW';

    return {
      eps,
      p95GapMs: Number.isFinite(p95Gap) ? p95Gap : 9_999_999,
      lastEventAgeMs: lastAge,
      openDurationMs: openDur,
      status,
    };
  }, [now, windowMs, staleMs, lastEventTs, openAt]);

  return {
    status,
    eps: Number.isFinite(eps) ? +eps.toFixed(2) : 0,
    p95GapMs,
    lastEventAgeMs,
    disconnects,
    reconnects,
    openDurationMs,
    windowMs,
  };
}

function useNow(intervalMs: number) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((x) => x + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return Date.now();
}
