import { NextResponse } from "next/server";
import { headers } from "next/headers";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function guessOrigin() {
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "127.0.0.1:3003";
  const protoHdr = h.get("x-forwarded-proto");
  const proto = process.env.VERCEL ? (protoHdr ?? "https") : "http";
  return `${proto}://${host}`;
}

async function fetchMetrics(origin: string) {
  const res = await fetch(`${origin}/api/public/metrics`, {
    headers: { accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`metrics ${res.status}`);
  return res.json() as Promise<{
    counters: { spark_ws_btcturk_msgs_total: number };
    gauges: { spark_ws_staleness_seconds: number };
  }>;
}

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const origin = guessOrigin();
  const body = await req.json().catch(() => ({} as any));
  const thr = body?.passThresholds ?? { staleness_sec_lt: 3, delta_msgs_gte: 1 };
  const params = { pairs: body?.pairs ?? ["BTCTRY", "BTCUSDT"], wsMode: body?.wsMode ?? "mock" };

  // Warm up + two samples separated by ~6s
  await fetchMetrics(origin).catch(() => null);
  await sleep(250);
  const m1 = await fetchMetrics(origin);
  await sleep(6000);
  const m2 = await fetchMetrics(origin);

  const delta = (m2.counters.spark_ws_btcturk_msgs_total - m1.counters.spark_ws_btcturk_msgs_total) | 0;
  const staleness = Number(m2.gauges.spark_ws_staleness_seconds);
  const pass = delta >= (thr.delta_msgs_gte ?? 1) && staleness < (thr.staleness_sec_lt ?? 3);

  return NextResponse.json({
    action: "/canary/run",
    params,
    checks: { delta_msgs: delta, staleness_s: staleness },
    thresholds: thr,
    status: pass ? "PASS" : "ATTENTION",
    dryRun: true,
    confirm_required: false,
    reason: "Canary via metrics sampling",
  });
}


