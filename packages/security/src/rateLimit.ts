const buckets: Map<string, number[]> = new Map();

export async function enforceRateLimit(key: string, limit: number, windowMs: number): Promise<{ ok: boolean; retryAfterMs?: number }> {
  const now = Date.now();
  const winStart = now - windowMs;
  const arr = buckets.get(key) || [];
  // purge old timestamps
  const recent = arr.filter(ts => ts > winStart);
  recent.push(now);
  buckets.set(key, recent);

  if (recent.length > limit) {
    const firstWithin = recent[recent.length - limit - 1];
    if (firstWithin !== undefined) {
      const retryAfterMs = (firstWithin + windowMs) - now;
      return { ok: false, retryAfterMs: Math.max(0, retryAfterMs) };
    }
    return { ok: false, retryAfterMs: windowMs };
  }
  return { ok: true };
} 
