// apps/web-next/src/app/api/exec/optimize/route.ts
import { NextResponse } from "next/server";
import type { OptimizeParams, OptimizeResult, BacktestMetrics } from "@/types/backtest";

const BASE = process.env.EXECUTOR_BASE_URL; // e.g. http://127.0.0.1:4001

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { code?: string; symbol?: string; params?: OptimizeParams };

  // Proxy to real executor if available
  if (BASE) {
    try {
      const r = await fetch(`${BASE}/api/exec/optimize`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await r.json();
      return NextResponse.json(json, { status: r.status });
    } catch {/* fall through to mock */}
  }

  // --- Mock fallback ---
  const trials: OptimizeResult["trials"] = [];
  const p = body.params ?? { param: "window", start: 5, end: 30, step: 5 };
  for (let x = p.start; x <= p.end; x += p.step) {
    const m: BacktestMetrics = {
      totalReturnPct: 5 + (x - p.start) * 0.8 + Math.random() * 2,
      sharpe: 0.8 + (x / (p.end || 1)) * 1.2,
      maxDrawdownPct: -Math.max(3, 10 - x * 0.2) - Math.random(),
      winRatePct: 45 + Math.min(40, x * 1.5),
      trades: 20 + Math.round(x * 1.2),
      avgTradePct: 0.05 + (x / 100) * 0.2,
      durationMs: 300 + Math.round(Math.random() * 200),
    };
    trials.push({ params: { [p.param]: x }, metrics: m });
  }
  // pick best by totalReturnPct
  const best = trials.reduce((a, b) => (b.metrics.totalReturnPct > a.metrics.totalReturnPct ? b : a), trials[0]);
  const res: OptimizeResult = { best: best.params, trials };
  return NextResponse.json(res, { status: 200 });
}
