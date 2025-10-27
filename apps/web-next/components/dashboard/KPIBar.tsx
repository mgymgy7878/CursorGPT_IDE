'use client';

import React from "react";
import useSWR from "swr";
import { useExchange } from "@/contexts/ExchangeContext";
import { p95LatencyClass } from "@/ui/tokens";

type NumMap = Record<string, number>;

type Card = {
  key: string;
  label: string;
  fmt?: (v: number) => string;
  isLatency?: boolean; // p95_ms gibi metrikler için
  deltaThreshold?: number; // görsel gürültüyü azaltmak için eşik
};

const CARDS: Card[] = [
  { key: 'ack_p95_ms', label: 'ACK P95', fmt: n => `${Math.round(n)} ms`, isLatency: true, deltaThreshold: 10 },
  { key: 'e2db_p95_ms', label: 'Event→DB P95', fmt: n => `${Math.round(n)} ms`, isLatency: true, deltaThreshold: 10 },
  { key: 'placed_total', label: 'Orders Placed', fmt: n => `${Math.round(n)}`, deltaThreshold: 1 },
  { key: 'fills_total', label: 'Fills', fmt: n => `${Math.round(n)}`, deltaThreshold: 1 },
];

const fetcher = async (url: string) => {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`metrics fetch ${res.status}`);
  return res.text();
};

// Prometheus metni toleranslı parse + exchange filtresi
function parseProm(text: string, exchange: 'binance' | 'btcturk'): NumMap {
  const out: NumMap = {};
  const lines = text.split(/\r?\n/);

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;

    // name{labels} value
    const m = /^([a-zA-Z_:][a-zA-Z0-9_:]*)(\{[^}]*\})?\s+([0-9.eE+\-]+)$/.exec(line);
    if (!m) continue;
    const [, name, labelsRaw, valStr] = m;
    const val = Number(valStr);
    if (!Number.isFinite(val)) continue;

    // label parse
    let labels: Record<string, string> = {};
    if (labelsRaw) {
      const inner = labelsRaw.slice(1, -1);
      for (const part of inner.split(',')) {
        const [k, v] = part.split('=');
        if (!k || v == null) continue;
        labels[k.trim()] = v.trim().replace(/^"|"$/g, '');
      }
      // exchange label varsa eşleşmeyeni at
      const ex = labels.exchange?.toLowerCase();
      if (ex && ex !== exchange) continue;
    }

    const lname = name.toLowerCase();
    const quantile = (labels as any).quantile ?? (labels as any).quantile_p;
    const isP95 = quantile === '0.95' || quantile === '0,95';

    // normalize: seconds → ms (name ipucuna göre)
    const asMs = (n: number, unitHint: string) =>
      /sec|_s\b/.test(unitHint) ? n * 1000 : n;

    if (isP95 && /ack/.test(lname)) {
      out.ack_p95_ms = asMs(val, lname);
      continue;
    }
    if (isP95 && /(event.*db|e2db)/.test(lname)) {
      out.e2db_p95_ms = asMs(val, lname);
      continue;
    }
    if (lname.includes('placed_total')) {
      out.placed_total = val;
      continue;
    }
    if (lname.includes('fills_total')) {
      out.fills_total = val;
      continue;
    }

    // generic p95 fallback
    if (isP95) {
      out[`${lname.replace(/[:]/g, '_')}_p95`] = val;
      continue;
    }
    // generic fallback
    out[lname] = val;
  }
  return out;
}

function TrendBadge({
  curr, prev, isLatency, threshold = 0,
}: { curr?: number; prev?: number; isLatency?: boolean; threshold?: number }) {
  if (curr == null || prev == null) return null;
  const delta = curr - prev;
  if (Math.abs(delta) < threshold) {
    return <span className="ml-2 text-[10px] text-zinc-500">•</span>;
  }
  if (isLatency) {
    if (delta < 0) {
      return <span className="ml-2 text-[10px] text-emerald-400" title={`Δ ${Math.round(delta)} ms`}>↓{Math.abs(Math.round(delta))}</span>;
    }
    return <span className="ml-2 text-[10px] text-rose-400" title={`Δ +${Math.round(delta)} ms`}>↑{Math.round(delta)}</span>;
  }
  const sign = delta >= 0 ? '+' : '';
  return <span className="ml-2 text-[10px] text-zinc-400" title={`Δ ${sign}${Math.round(delta)}`}>{sign}{Math.round(delta)}</span>;
}

export default function KPIBar() {
  const { resolved } = useExchange(); // 'binance' | 'btcturk'
  const { data, error } = useSWR('/api/public/metrics', fetcher, {
    refreshInterval: 10_000,
  });

  const [updatedAt, setUpdatedAt] = React.useState<number | null>(null);
  const prevRef = React.useRef<NumMap>({});

  const metrics = React.useMemo<NumMap>(() => {
    if (!data) return {};
    try {
      const parsed = parseProm(data, resolved);
      return parsed;
    } catch {
      return {};
    }
  }, [data, resolved]);

  React.useEffect(() => {
    if (!data) return;
    setUpdatedAt(Date.now());
  }, [data]);

  React.useEffect(() => {
    prevRef.current = { ...metrics };
  }, [metrics]);

  const get = (k: string): number | undefined =>
    Number.isFinite((metrics as any)[k]) ? (metrics as any)[k] : undefined;

  const getPrev = (k: string): number | undefined =>
    Number.isFinite((prevRef.current as any)[k]) ? (prevRef.current as any)[k] : undefined;

  if (!data && !error) {
  return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {CARDS.map(c => (
          <div key={c.key} className="rounded-lg border border-zinc-800 p-2">
            <div className="text-[11px] text-zinc-500">{c.label}</div>
            <div className="mt-1 h-6 w-20 rounded bg-zinc-800 animate-pulse" />
      </div>
        ))}
    </div>
  );
}

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2" aria-live="polite">
      {CARDS.map((c) => {
        const v = get(c.key);
        const p = getPrev(c.key);
        const content = v == null ? '—' : c.fmt ? c.fmt(v) : String(v);
        const isLatency = !!c.isLatency;
        const color =
          v == null
            ? 'text-zinc-400'
            : isLatency
            ? p95LatencyClass(v)
            : 'text-zinc-100';

        const title =
          updatedAt
            ? `Last update: ${new Date(updatedAt).toLocaleTimeString()}`
            : undefined;

  return (
          <div key={c.key} className="rounded-lg border border-zinc-800 p-2" title={title}>
            <div className="text-[11px] text-zinc-400 flex items-center justify-between">
              <span>{c.label}</span>
              {error && (
                <span className="text-[10px] text-rose-400 ml-2">metrics unavailable</span>
              )}
            </div>
            <div className={`mt-0.5 text-lg font-semibold ${color} flex items-baseline`}>
              <span>{content}</span>
              <TrendBadge curr={v} prev={p} isLatency={isLatency} threshold={c.deltaThreshold ?? 0} />
            </div>
        </div>
        );
      })}
    </div>
  );
}