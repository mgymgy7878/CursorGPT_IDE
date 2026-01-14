export const dynamic = 'force-dynamic';

/**
 * Live Status API - StatusBar için gerçek zamanlı metrikler
 * GET /api/live/status
 *
 * Returns: { api, feed, executor, metrics }
 */

const EXECUTOR_URL = process.env.EXECUTOR_URL || process.env.NEXT_PUBLIC_EXECUTOR_URL || 'http://127.0.0.1:4001';
const FEED_URL = process.env.FEED_URL || process.env.NEXT_PUBLIC_FEED_URL || EXECUTOR_URL; // Feed executor ile aynı host olabilir

interface LiveStatusResponse {
  api: { ok: boolean };
  feed: { ok: boolean; stalenessSec?: number };
  executor: { ok: boolean; latencyMs?: number };
  metrics: {
    p95Ms: number | null;
    rtDelayMs: number | null;
    tradeCount: number | null;
    volumeUsd: string | null;
    alerts: {
      active: number;
      total: number;
      todayTriggered: number;
    } | null;
  };
}

async function checkExecutor(): Promise<{ ok: boolean; latencyMs?: number }> {
  try {
    const start = Date.now();
    const res = await fetch(`${EXECUTOR_URL}/healthz`, {
      signal: AbortSignal.timeout(2000),
      headers: { 'Accept': 'application/json' }
    });
    const latencyMs = Date.now() - start;
    return { ok: res.ok, latencyMs };
  } catch {
    return { ok: false };
  }
}

async function checkFeed(): Promise<{ ok: boolean; stalenessSec?: number }> {
  try {
    // Feed için executor'un /healthz'ini kullan (feed ayrı servis değilse)
    const res = await fetch(`${FEED_URL}/healthz`, {
      signal: AbortSignal.timeout(2000),
      headers: { 'Accept': 'application/json' }
    });
    // Staleness hesaplama: executor'dan metrics alabilirsek oradan
    return { ok: res.ok, stalenessSec: res.ok ? 0 : undefined };
  } catch {
    return { ok: false };
  }
}

async function getMetrics(): Promise<LiveStatusResponse['metrics']> {
  try {
    // Executor'dan Prometheus metrics çek
    const res = await fetch(`${EXECUTOR_URL}/metrics`, {
      signal: AbortSignal.timeout(2000),
    });
    if (!res.ok) {
      return {
        p95Ms: null,
        rtDelayMs: null,
        tradeCount: null,
        volumeUsd: null,
        alerts: null,
      };
    }

    const text = await res.text();
    // Prometheus metrics parse (basit regex ile)
    // Örnek: http_request_duration_seconds_bucket{le="0.05"} 123
    const p95Match = text.match(/http_request_duration_seconds_bucket.*le="0\.095".*?(\d+)/);
    const p95Ms = p95Match ? parseFloat(p95Match[1]) * 1000 : null;

    // Trade count ve volume için custom metric'ler varsa parse et
    // Şimdilik null döndür, gerçek implementasyonda executor'dan gelecek
    return {
      p95Ms,
      rtDelayMs: null, // Executor'dan staleness alınabilir
      tradeCount: null,
      volumeUsd: null,
      alerts: null,
    };
  } catch {
    return {
      p95Ms: null,
      rtDelayMs: null,
      tradeCount: null,
      volumeUsd: null,
      alerts: null,
    };
  }
}

export async function GET(): Promise<Response> {
  const [executor, feed, metrics] = await Promise.all([
    checkExecutor(),
    checkFeed(),
    getMetrics(),
  ]);

  // API her zaman ok (UI çalışıyorsa)
  const response: LiveStatusResponse = {
    api: { ok: true },
    feed,
    executor,
    metrics,
  };

  return Response.json(response, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
