import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractBearer } from '@spark/auth';
import { enforceRateLimit, audit } from '@spark/security';

export const dynamic = 'force-dynamic';

interface CanaryRunRequest {
  action: "/canary/run";
  params: {
    scope: string;
    symbols: string[];
    samples: number;
    checks: string[];
    strategy: {
      name: string;
      ema_fast: number;
      ema_slow: number;
      atr: number;
      tp_atr: number;
      sl_atr: number;
      risk_notional_pct: number;
    };
  };
  dryRun: boolean;
  confirm_required: boolean;
  reason: string;
}

export async function POST(request: NextRequest) {
  const timestamp = Date.now();
  const raw = await request.json() as unknown;
  const body = (raw ?? {}) as Partial<CanaryRunRequest> & Record<string, any>;
  const params = (body && typeof body === "object" && "params" in body && (body as any).params)
    ? (body as any).params
    : (body as any);
  const dryRun = typeof (body as any).dryRun === "boolean" ? Boolean((body as any).dryRun) : true;

  // Auth check
  const authHeader = extractBearer(request.headers.get('authorization'));
  const authResult = verifyToken(authHeader || '');
  if (!authResult.ok) {
    return NextResponse.json({ error: 'Unauthorized', timestamp }, { status: 401 });
  }

  // Rate limiting
  const rateLimit = enforceRateLimit(undefined, 1);
  if (!rateLimit.ok) {
    return NextResponse.json({ error: 'Rate limited', retryAfterMs: rateLimit.retryAfterMs, timestamp }, { status: 429 });
  }

  // Audit log
  audit({
    type: 'canary_run_request',
    data: { scope: params?.scope, symbols: params?.symbols, samples: params?.samples, dryRun },
    ts: timestamp
  });

  // Mock canary run execution
  const metrics = {
    place_order_p95_ms: 245,
    cancel_order_p95_ms: 189,
    ack_latency_p95_ms: 156,
    ws_stream_lag_ms: 23,
    success_rate: 0.99
  };
  const results = {
    scope: params?.scope,
    symbols: params?.symbols,
    samples: params?.samples,
    metrics,
    strategy_test: {
      name: params?.strategy?.name,
      signals_generated: 8,
      trades_executed: dryRun ? 0 : 3,
      pnl_unrealized: dryRun ? 0 : 45.67
    },
    duration_ms: 15450,
    timestamp
  };

  // cache last canary outcome for baseline endpoint
  try { (globalThis as any).__sparkLastCanary = results; } catch { /* ignore */ }

  return NextResponse.json({
    ok: true,
    p95_ms: metrics.ack_latency_p95_ms,
    success_rate: metrics.success_rate,
    evidence_dir: `evidence/local/canary/${new Date().toISOString().slice(0,10)}`,
    data: results,
    timestamp
  });
}
