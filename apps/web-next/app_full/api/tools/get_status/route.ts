import { NextRequest, NextResponse } from 'next/server';
import { extractBearer, verifyToken } from '@spark/auth';
import { enforceRateLimit, audit } from '@spark/security';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type IncludeKey = 'health' | 'p95' | 'open_orders' | 'rate_limit';

interface ToolsGetStatusRequest {
  action: '/tools/get_status';
  params?: { include?: IncludeKey[] };
  dryRun?: boolean;
  confirm_required?: boolean;
  reason?: string;
}

declare global {
  // Son canary çalışmasının özetini globalde tutarız (dev hot-reload güvenli)
  // eslint-disable-next-line no-var
  var __sparkLastCanary: any | undefined;
}

export async function POST(request: NextRequest) {
  const timestamp = Date.now();
  const raw = (await request.json().catch(() => ({}))) as Partial<ToolsGetStatusRequest> & Record<string, any>;
  const includes: IncludeKey[] = Array.isArray(raw?.params?.include) ? raw.params!.include as IncludeKey[] : ['health','p95'];

  // Auth
  const token = extractBearer(request.headers.get('authorization'));
  const auth = verifyToken(token || '');
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized', timestamp }, { status: 401 });

  // Rate limit
  const rate = enforceRateLimit(undefined, 1);
  if (!rate.ok) return NextResponse.json({ error: 'Rate limited', retryAfterMs: rate.retryAfterMs, timestamp }, { status: 429 });

  const out: Record<string, unknown> = { timestamp };

  if (includes.includes('health')) {
    const host = request.headers.get('host') || '127.0.0.1:3003';
    const proto = request.headers.get('x-forwarded-proto') || 'http';
    const base = `${proto}://${host}`;
    const exec = process.env.EXEC_ORIGIN || 'http://127.0.0.1:4001';
    let webCode = 0, execCode = 0;
    try { const r = await fetch(`${base}/api/public/health`, { cache: 'no-store' }); webCode = r.status; } catch { /* ignore */ }
    try { const r = await fetch(`${exec}/api/public/health`, { cache: 'no-store' }); execCode = r.status; } catch { /* ignore */ }
    out.health = { web: webCode, executor: execCode, overall: webCode === 200 && execCode === 200 };
  }

  if (includes.includes('p95')) {
    const last = (globalThis as any).__sparkLastCanary;
    const ack = last?.metrics?.ack_latency_p95_ms ?? null;
    const success = last?.metrics?.success_rate ?? null;
    out.p95 = { ack_p95_ms: ack, success_rate: success, observed_at: last?.timestamp ?? null };
  }

  if (includes.includes('open_orders')) {
    out.open_orders = { count: 0, items: [] };
  }

  if (includes.includes('rate_limit')) {
    out.rate_limit = { ok: true };
  }

  audit({ type: 'tools_get_status', data: { includes }, ts: timestamp });
  return NextResponse.json({ ok: true, data: out, timestamp });
}


