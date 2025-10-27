import { TokenBucket } from "@spark/shared";

export type AuditLevel = "info" | "warn" | "error";
export type AuditEvent = { 
  type: string; 
  at?: number; 
  level?: AuditLevel; 
  data?: unknown; 
  ip?: string; 
  ts?: number; 
  [k: string]: unknown;
};

export type RateLimiterLike =
  | (Partial<TokenBucket> & { allow?: (n?: number) => boolean })
  | { allow?: (n?: number) => boolean; tokens?: number; capacity?: number; refillRate?: number; lastRefill?: number; [k: string]: unknown }
  | undefined | null;

export type RateLimitResult = { ok: boolean; retryAfterMs?: number; tokensRemaining?: number; [k: string]: unknown };

function calcRetryAfterMs(b: any, need = 1): number | undefined {
  if (typeof b.refillRate === "number") {
    const deficit = Math.max(0, need - (typeof b.tokens === "number" ? b.tokens : 0));
    if (deficit <= 0) return 0;
    const sec = deficit / Math.max(1e-9, b.refillRate);
    return Math.ceil(sec * 1000);
  }
  return 1000; // default 1s
}

// Primary function returning object structure that callers expect
export function enforceRateLimit(bucket?: RateLimiterLike, n = 1): RateLimitResult {
  const b: any = bucket ?? {};
  try {
    if (typeof b.allow === "function") {
      const ok = Boolean(b.allow(n));
      return { 
        ok, 
        retryAfterMs: ok ? undefined : calcRetryAfterMs(b, n),
        tokensRemaining: b.tokens ?? undefined 
      };
    }
    if (typeof b.tokens === "number") {
      if (b.tokens >= n) { 
        b.tokens -= n; 
        return { ok: true, tokensRemaining: b.tokens };
      }
      return { ok: false, retryAfterMs: calcRetryAfterMs(b, n) };
    }
    return { ok: true };
  } catch {
    return { ok: true };
  }
}

export function audit(ev: AuditEvent | string, data?: unknown): void {
  const e: AuditEvent = typeof ev === "string" ? { type: ev, data } : ev;
  if (process.env.DEBUG?.includes("audit")) { /* eslint-disable no-console */ console.log("[audit]", e); }
}

export default { enforceRateLimit, audit };
