import { NextResponse } from "next/server";
import { metrics } from "@/server/metrics";
import { snapshotToPromText } from "@/server/metricsExport";

export const dynamic = 'force-dynamic';

export async function GET() {
  const body = snapshotToPromText({
    counters: metrics.counters,
    gauges: metrics.gauges,
    ts: Date.now(),
  });
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; version=0.0.4; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

