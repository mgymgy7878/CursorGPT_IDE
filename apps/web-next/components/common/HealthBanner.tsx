'use client';

import useSWR from "swr";
import { fetcherNoStore } from "@/lib/api";
import { useExchange } from "@/contexts/ExchangeContext";
import { exBadgeClass, healthBarClass, healthToneLabel } from "@/ui/tokens";
import { badgeClass } from "@/ui/badge";
import { toneAriaLabel } from "@/ui/a11y";

type Health = { ok: boolean; service?: string };

export default function HealthBanner() {
  const { data, error, isLoading } = useSWR<Health>('/api/public/health', fetcherNoStore, {
    refreshInterval: 10_000,
  });
  const { exchange, resolved } = useExchange();

  const state: 'ok'|'warn'|'down'|'loading' =
    isLoading ? 'loading' : error ? 'down' : data?.ok ? 'ok' : 'warn';

  if (state === 'ok') return null;

  const text = healthToneLabel(state);
  const color = healthBarClass(state);
  const badgeCls = exBadgeClass(exchange === 'auto' ? 'auto' : resolved);

  return (
    <div className={`sticky top-0 z-30 w-full border-b ${color} backdrop-blur px-3 py-2`}>
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] ${badgeCls}`}
          aria-label={`Selected exchange: ${exchange === 'auto' ? 'Auto' : resolved.toUpperCase()}`}
        >
          <span className="opacity-80">EX:</span>
          <b className="tracking-wide">{exchange === 'auto' ? 'AUTO' : resolved.toUpperCase()}</b>
        </span>
        <span className={badgeClass({ tone: state as any })} aria-label={toneAriaLabel(state as any)} title={toneAriaLabel(state as any)}>
          {text}
        </span>
      </div>
    </div>
  );
} 
