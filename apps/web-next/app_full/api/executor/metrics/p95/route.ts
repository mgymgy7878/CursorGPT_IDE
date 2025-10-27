export const runtime = 'nodejs';

function parseProm(promText: string) {
  // basit Prometheus text parser (tek metrik için yeterli)
  const lines = promText.split('\n').map(l=>l.trim()).filter(Boolean);
  const buckets: {le:number,count:number}[] = [];
  let totalCount = 0;
  let totalSum = 0;

  for (const l of lines) {
    // bucket
    if (l.startsWith('spark_place_ack_duration_seconds_bucket')) {
      // spark_place_ack_duration_seconds_bucket{exchange="paper",symbol="BTCUSDT",le="0.35"} 42
      const m = l.match(/le="([^"]+)"\} (\d+(?:\.\d+)?)/);
      if (m) buckets.push({ le: m[1]==='+Inf' ? Number.POSITIVE_INFINITY : Number(m[1]), count: Number(m[2]) });
    }
    // _sum
    if (l.startsWith('spark_place_ack_duration_seconds_sum')) {
      const m = l.match(/\}\s+(\d+(?:\.\d+)?)/);
      if (m) totalSum = Number(m[1]);
    }
    // _count
    if (l.startsWith('spark_place_ack_duration_seconds_count')) {
      const m = l.match(/\}\s+(\d+(?:\.\d+)?)/);
      if (m) totalCount = Number(m[2]);
    }
  }
  buckets.sort((a,b)=>a.le-b.le);
  const p = (quantile: number) => {
    if (!totalCount || buckets.length===0) return null;
    const target = totalCount * quantile;
    for (const b of buckets) {
      if (b.count >= target) return b.le === Infinity ? null : b.le;
    }
    return null;
  };
  return { count: totalCount, sum: totalSum, p50: p(0.5), p90: p(0.9), p95: p(0.95), p99: p(0.99) };
}

export async function GET() {
  try {
    const r = await fetch('http://127.0.0.1:4001/metrics', { cache: 'no-store' });
    if (!r.ok) return new Response(JSON.stringify({ ok:false, error:`metrics ${r.status}` }), { status: 500 });
    const text = await r.text();
    const stats = parseProm(text);
    return new Response(JSON.stringify({ ok:true, ts: Date.now(), stats }), { headers: { 'content-type':'application/json' } });
  } catch (e:any) {
    return new Response(JSON.stringify({ ok:false, error: String(e?.message || e) }), { status: 500 });
  }
}
