
export const dynamic = 'force-dynamic';

import type { NextRequest } from "next/server";

const EXECUTOR = process.env.EXECUTOR_URL || 'http://127.0.0.1:4001';
const GET_ALLOW = new Set(['manager/summary','portfolio/summary','lab/status']);
const POST_ALLOW = new Set<string>([
  'canary/arm',
  'canary/confirm',
  'canary/stats',
  'canary/matrix',
  'metrics',
  'canary/advise',
  'canary/advise/script',
  // 'canary/advise/apply',            // kullanıyorsan aç
  // 'canary/advise/suggest-outage',   // kullanıyorsan aç
  'canary/run',
  'canary/evidence/bundle',

  'btcturk/order/market',
  'btcturk/smoke',

  'health',
  'healthz',
  'positions',
  'orders/open',

  'backtest/mock',
  'backtest/data',

  'guardrails/policy.get',
  'guardrails/policy.set',
  'guardrails/check',

  'lab/strategies',
  'lab/run',
  'lab/sweep',

  // Fusion/Advisor additions
  'fusion/model.candidate.set',
  'fusion/risk.report.daily',
  'fusion/retrain.suggest',
  'canary/advise/suggest'
]);

const EVIDENCE = (code: number, reason: string) => Response.json(
  { ok:false, degraded:true, evidence:{ code, reason, ts: new Date().toISOString() } },
  { status: code, headers: { 'Cache-Control':'no-store' } }
);

function withTimeout(ms: number, signal?: AbortSignal) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  const composite = signal
    ? new AbortController()
    : ctrl;
  if (signal && composite) {
    signal.addEventListener('abort', () => composite.abort(), { once:true });
    setTimeout(() => {}, 0); // no-op
  }
  return { signal: ctrl.signal, clear: () => clearTimeout(id) };
}

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  const path = (params.path || []).join('/');
  const seg = path.split('?')[0];
  const segNorm = seg.replace(/^\/+|\/+$/g,'');
  const search = (req.nextUrl && req.nextUrl.search) ? req.nextUrl.search : '';

  // SSE passthrough (no timeout, stream body)
  if (segNorm.startsWith('streams/sse')) {
    const url = `${EXECUTOR}/${path}${search}`;
    try {
      const ctrl = new AbortController();
      req.signal.addEventListener('abort', () => ctrl.abort(), { once:true });
      const res = await fetch(url, { method:'GET', headers:{ 'Cache-Control':'no-store' } as any, signal: ctrl.signal });
      if (!res.ok) return EVIDENCE(res.status, `upstream ${res.status}`);
      const headers = new Headers(res.headers);
      headers.set('Content-Type','text/event-stream');
      headers.set('Cache-Control','no-cache, no-transform');
      headers.set('Connection','keep-alive');
      headers.delete('content-encoding');
      return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
    } catch (e:any) {
      return EVIDENCE(504, 'timeout_or_network');
    }
  }

  const passthrough = ['metrics','health','healthz','positions','orders/open','canary/evidence/report','streams/sse'];
  if (passthrough.some(p => segNorm.startsWith(p))) {
    const url = `${EXECUTOR}/${path}${search}`;
    const { signal, clear } = withTimeout(1500, req.signal);
    try {
      const res = await fetch(url, { method:'GET', signal, cache:'no-store' as any, headers:{ 'Cache-Control':'no-store' }});
      clear();
      if (!res.ok) return EVIDENCE(res.status, `upstream ${res.status}`);
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        const headers = new Headers(res.headers);
        headers.set('Cache-Control','no-store');
        headers.delete('content-encoding');
        return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
      }
      if (contentType.includes('text/plain')) {
        const headers = new Headers(res.headers);
        headers.set('Cache-Control','no-store');
        headers.set('Content-Type','text/plain');
        headers.delete('content-encoding');
        return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
      }
      if (contentType.includes('text/event-stream')) {
        const headers = new Headers(res.headers);
        headers.set('Cache-Control','no-cache, no-transform');
        headers.set('Content-Type','text/event-stream');
        headers.set('Connection','keep-alive');
        headers.delete('content-encoding');
        return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
      }
      const data = await res.json();
      return Response.json(data, { headers:{ 'Cache-Control':'no-store' }});
    } catch (e:any) {
      clear();
      return EVIDENCE(504, 'timeout_or_network');
    }
  }

  if (!GET_ALLOW.has(segNorm)) return EVIDENCE(405, `GET not allowed for ${segNorm}`);

  const url = `${EXECUTOR}/${path}${search}`;
  const { signal, clear } = withTimeout(1500, req.signal);
  try {
    const res = await fetch(url, { method:'GET', signal, cache:'no-store' as any, headers:{ 'Cache-Control':'no-store' }});
    clear();
    if (!res.ok) return EVIDENCE(res.status, `upstream ${res.status}`);
    const data = await res.json();
    return Response.json(data, { headers:{ 'Cache-Control':'no-store' }});
  } catch (e: any) {
    clear();
    return EVIDENCE(504, 'timeout_or_network');
  }
}

export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  const path = (params.path || []).join('/');
  const seg = path;
  const segNorm = seg.replace(/^\/+|\/+$/g,'');
  const search = (req.nextUrl && req.nextUrl.search) ? req.nextUrl.search : '';
  if (!POST_ALLOW.has(segNorm)) return EVIDENCE(405, `POST not allowed for ${segNorm}`);

  const url = `${EXECUTOR}/${path}${search}`;
  const body = await req.text();
  const { signal, clear } = withTimeout(1500, req.signal);
  try {
    const res = await fetch(url, {
      method:'POST', signal,
      body, cache:'no-store' as any,
      headers: { 'Content-Type':'application/json', 'Cache-Control':'no-store' }
    });
    clear();
    if (!res.ok) {
      // propagate retry-after if present and include retryAfterMs in JSON on 429
      const retryAfter = res.headers.get('retry-after') || res.headers.get('Retry-After');
      const headers: HeadersInit = { 'Cache-Control':'no-store' };
      if (retryAfter) (headers as any)['retry-after'] = retryAfter;
      if (res.status === 429) {
        const sec = retryAfter ? Number(retryAfter) : undefined;
        const retryAfterMs = isFinite(sec as any) && sec !== undefined ? Math.max(0, Math.round(Number(sec) * 1000)) : undefined;
        return Response.json({ ok:false, degraded:true, error:'rate_limited', retryAfterMs }, { status: 429, headers });
      }
      return EVIDENCE(res.status, `upstream ${res.status}`);
    }
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/zip')) {
      const headers = new Headers(res.headers);
      headers.set('Cache-Control','no-store');
      headers.set('Content-Disposition', 'attachment; filename="evidence.zip"');
      headers.delete('content-encoding');
      return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
    }
    if (contentType.includes('text/html')) {
      const headers = new Headers(res.headers);
      headers.set('Cache-Control','no-store');
      headers.delete('content-encoding');
      return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
    }
    if (contentType.includes('text/plain')) {
      const headers = new Headers(res.headers);
      headers.set('Cache-Control','no-store');
      headers.set('Content-Type','text/plain');
      headers.delete('content-encoding');
      return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
    }
    const data = await res.json();
    return Response.json(data, { headers:{ 'Cache-Control':'no-store' }});
  } catch (e:any) {
    clear();
    return EVIDENCE(504, 'timeout_or_network');
  }
} 