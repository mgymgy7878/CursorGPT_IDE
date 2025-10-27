export const dynamic = "force-dynamic";
export const revalidate = 0;
import { NextResponse } from "next/server";

export async function GET() {
  let counters: Record<string, number> = {};
  let gauges: Record<string, number> = {};
  try {
    // Eğer arka uç snapshot'ı varsa burada okunabilir
    // const real = await fetch(process.env.METRICS_SNAPSHOT_URL!, { cache: 'no-store' }).then(r=>r.json());
    // counters = real.counters ?? {};
    // gauges = real.gauges ?? {};
  } catch {}

  const cWs = Number(counters["spark_ws_btcturk_msgs_total"]);
  const gStale = Number(gauges["spark_ws_staleness_seconds"]);
  const up = Number(gauges["spark_app_uptime_seconds"]);

  counters["spark_ws_btcturk_msgs_total"] = Number.isFinite(cWs) ? cWs : 0;
  gauges["spark_ws_staleness_seconds"] = Number.isFinite(gStale) ? gStale : 0;
  gauges["spark_app_uptime_seconds"] = Number.isFinite(up) ? up : 0;

  return NextResponse.json({ counters, gauges }, { status: 200 });
}


