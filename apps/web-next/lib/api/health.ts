// 'use client' gerekli değil; node API yok
export type SystemHealth = {
  ok: boolean;
  status: 'NORMAL' | 'DEGRADED' | 'DOWN';
  mode: 'live' | 'mock';
  ts?: string;
};

export async function fetchSystemHealth(): Promise<SystemHealth> {
  const res = await fetch('/api/public/system/health', { cache: 'no-store' });
  if (!res.ok) throw new Error('health fetch failed');
  return res.json();
}

type PollOpts = {
  intervalMs?: number;
  onData: (h: SystemHealth) => void;
  onError?: (e: unknown) => void;
};

export function startHealthPolling({ intervalMs = 5000, onData, onError }: PollOpts) {
  let cancelled = false;

  const tick = async () => {
    try {
      const h = await fetchSystemHealth();
      if (!cancelled) onData(h);
    } catch (e) {
      onError?.(e);
    }
  };

  const id = setInterval(tick, intervalMs);
  tick();
  return () => { cancelled = true; clearInterval(id); };
}
