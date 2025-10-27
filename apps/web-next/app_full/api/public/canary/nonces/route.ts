import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

function safeReadJSON(p: string) {
  try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return null; }
}
export async function GET(_req: NextRequest) {
  const base = path.resolve(process.cwd(), "evidence", "canary");
  if (!fs.existsSync(base)) {
    return new NextResponse(JSON.stringify({ nonces: [] }), { status: 200, headers: { "content-type": "application/json" } });
  }
  const dirs = fs.readdirSync(base).filter(d => fs.existsSync(path.join(base, d, "plan.json")));
  const items = dirs.map(nonce => {
    const plan = safeReadJSON(path.join(base, nonce, "plan.json")) || {};
    const latency = safeReadJSON(path.join(base, nonce, "latency.json")) || {};
    const g = (latency?.gates ?? {}) as Record<string, any>;
    const thr = (plan?.thresholds ?? { ack_p95_ms:1000, event_to_db_p95_ms:300, ingest_lag_p95_s:2, seq_gap_total:0 }) as Record<string, number>;
    const hasUnknown = [g.ack_p95_ms, g.event_to_db_p95_ms, g.ingest_lag_p95_s, g.seq_gap_total]
      .some(v => v === "unknown" || v === undefined || v === null);
    const within = !hasUnknown
      && Number(g.ack_p95_ms) < thr.ack_p95_ms
      && Number(g.event_to_db_p95_ms) < thr.event_to_db_p95_ms
      && Number(g.ingest_lag_p95_s) <= thr.ingest_lag_p95_s
      && Number(g.seq_gap_total) === thr.seq_gap_total;
    const decision = hasUnknown ? "HOLD" : (within ? "GO→Step1" : "HOLD");
    const status = hasUnknown ? "WARNING" : "ARMED";
    return {
      nonce,
      ts: (plan as any)?.ts ?? "",
      decision,
      status,
      hasLatency: !!(latency as any)?.gates,
      paths: {
        plan: path.join(base, nonce, "plan.json"),
        latency: path.join(base, nonce, "latency.json"),
        confirm: path.join(base, nonce, "confirm.json"),
        live_plan: path.join(base, nonce, "live_plan.json"),
      }
    };
  }).sort((a,b) => a.nonce.localeCompare(b.nonce)).reverse();
  return new NextResponse(JSON.stringify({ nonces: items }), { status: 200, headers: { "content-type": "application/json" } });
} 