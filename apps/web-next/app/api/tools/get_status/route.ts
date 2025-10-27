// Minimal status aggregator – POST
import { NextRequest } from "next/server";

const BASE = process.env.NEXT_PUBLIC_EXECUTOR_BASE || "http://127.0.0.1:4001";

export async function POST(_req: NextRequest) {
  const out: any = { webNext: {}, executor: {}, ts: new Date().toISOString() };
  try {
    // UI health (kendi kendine)
    const uiHealth = { ok: true, status: 200, path: "/api/public/health" };

    // Executor health
    const exH = await fetch(`${BASE}/health`).then(r => ({ ok: r.ok, status: r.status })).catch(() => ({ ok:false, status:0 }));
    // Executor metrics (opsiyonel)
    const exM = await fetch(`${BASE}/metrics`).then(r => ({ ok: r.ok, status: r.status })).catch(() => ({ ok:false, status:0 }));

    out.webNext = uiHealth;
    out.executor = { health: exH, metrics: exM, base: BASE };

    const ok = uiHealth.ok && exH.ok;
    return new Response(JSON.stringify({ ok, ...out }, null, 2), { status: ok ? 200 : 503, headers: { "content-type":"application/json" }});
  } catch (err:any) {
    out.error = err?.message || "unknown";
    return new Response(JSON.stringify(out, null, 2), { status: 500, headers: { "content-type":"application/json" }});
  }
}
