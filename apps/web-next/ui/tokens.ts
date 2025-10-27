// apps/web-next/ui/tokens.ts
// Tek noktadan UI renk token'ları + küçük yardımcılar

export type ResolvedExchange = 'binance' | 'btcturk';

export const EX_BADGE = {
  binance: 'text-amber-300 border border-amber-700/40 bg-amber-400/10',
  btcturk: 'text-sky-300 border border-sky-700/40 bg-sky-400/10',
  auto: 'text-zinc-300 border border-zinc-700/40 bg-zinc-400/10',
} as const;

export function exBadgeClass(resolved: ResolvedExchange | 'auto') {
  return EX_BADGE[resolved] ?? EX_BADGE.auto;
}

// p95 latency tone ve class tek yerden
export type UITone = 'ok' | 'warn' | 'down' | 'loading';
export const p95LatencyTone = (ms?: number): UITone => {
  if (!Number.isFinite(ms as number)) return 'loading';
  const v = ms as number;
  if (v <= 250) return 'ok';
  if (v <= 500) return 'warn';
  return 'down';
};
export function p95LatencyClass(ms?: number) {
  const tone = p95LatencyTone(ms);
  switch (tone) {
    case 'ok': return 'text-emerald-300';
    case 'warn': return 'text-amber-300';
    case 'down': return 'text-rose-400';
    default: return 'text-zinc-400';
  }
}

// Health tones
export type HealthTone = 'ok' | 'warn' | 'down' | 'loading';

export const HEALTH_BAR: Record<HealthTone, string> = {
  ok: 'bg-emerald-900/30 border-emerald-700',
  warn: 'bg-amber-900/40 border-amber-700',
  down: 'bg-rose-900/40 border-rose-700',
  loading: 'bg-amber-900/40 border-amber-700',
};

export function healthBarClass(tone: HealthTone) {
  return HEALTH_BAR[tone] ?? HEALTH_BAR.ok;
}

export function healthToneLabel(tone: HealthTone): string {
  switch (tone) {
    case 'ok': return 'System healthy';
    case 'warn': return 'Executor reachable but not healthy';
    case 'down': return 'Executor unreachable';
    case 'loading': return 'Checking executor health…';
    default: return 'System status';
  }
}

// Rozet tonları (badge.ts ile birlikte)
export const toneToBadgeClass: Record<UITone, string> = {
  ok: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30',
  warn: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30',
  down: 'bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30',
  loading: 'bg-zinc-500/10 text-zinc-300 ring-1 ring-zinc-400/20',
}; 