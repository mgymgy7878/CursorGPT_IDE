import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

export async function GET(_req: NextRequest) {
  const p = path.resolve(process.cwd(), "evidence", "canary", "INDEX.csv");
  if (!fs.existsSync(p)) {
    return new NextResponse("nonce,ts,dryRun,status,decision,reason,ack_p95_ms,event_to_db_p95_ms,ingest_lag_p95_s,seq_gap_total,slippage_p95_bps,clock_drift_ms_p95,observed_signals,plan_path,latency_path,metrics_path,audit_path\n", {
      status: 200, headers: { "content-type": "text/csv; charset=utf-8" }
    });
  }
  const buf = fs.readFileSync(p);
  return new NextResponse(buf, { status: 200, headers: { "content-type": "text/csv; charset=utf-8" } });
} 