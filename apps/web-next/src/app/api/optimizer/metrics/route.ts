import { NextResponse } from "next/server";

type Metrics = {
  throughputPerMin: number;   // last 5m avg
  concurrency: number;        // running jobs
  rejectRate: number;         // 0..1
  queueDepth: number;
  trend: Array<{ t:number; throughput:number }>; // sparkline
};

async function tryFetch(url: string) {
  try {
    const r = await fetch(url, { cache: "no-store", next: { revalidate: 0 } });
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}

function mockMetrics(): Metrics {
  const now = Date.now();
  const trend = Array.from({length:24}, (_,i)=>({
    t: now - (23-i)*60_000,
    throughput: 8 + Math.round(Math.sin(i/3)*3 + Math.random()*2),
  }));
  return {
    throughputPerMin: 9.2,
    concurrency: 1,
    rejectRate: 0.01,
    queueDepth: 3,
    trend,
  };
}

export async function GET() {
  // Beklenen servis uçları: /optimizer/metrics
  const svc = await tryFetch("http://127.0.0.1:4001/optimizer/metrics");
  if (svc?.metrics) return NextResponse.json(svc.metrics);
  return NextResponse.json(mockMetrics());
}

