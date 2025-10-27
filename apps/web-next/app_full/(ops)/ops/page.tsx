export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function ping(url: string) {
  try {
    const res = await fetch(url, { cache: 'no-store', next: { revalidate: 0 } });
    const txt = await res.text();
    return { ok: res.ok, status: res.status, body: txt.slice(0, 500) };
  } catch (e: any) {
    return { ok: false, status: 0, body: String(e?.message ?? e) };
  }
}

export default async function Page() {
  const origin = process.env.EXECUTOR_ORIGIN ?? 'http://127.0.0.1:4001';
  const health = await ping(`${origin}/health`);
  const metrics = await ping(`${origin}/public/metrics/prom`);
  const time = await ping(`${origin}/api/futures/time`);

  const ok = health.ok && time.ok;

  return (
    <main style={{padding: 16}}>
      <h1 style={{fontSize: 18, marginBottom: 8}}>Spark Ops</h1>
      <div style={{
        display:'grid', gap:12, gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))'
      }}>
        <Card title="Executor /health" good={health.ok} detail={`${health.status} ${health.ok?'OK':'FAIL'}`} />
        <Card title="Futures /time" good={time.ok} detail={`${time.status} ${time.ok?'OK':'FAIL'}`} />
        <Card title="Prometheus /metrics" good={metrics.ok} detail={`${metrics.status} ${metrics.ok?'OK':'FAIL'}`} />
      </div>
      <p style={{marginTop:16}}>STATUS: <b style={{color: ok?'#059669':'#dc2626'}}>{ok?'GREEN':'RED'}</b></p>
      <p style={{fontSize:12, opacity:.7}}>UI bu sayfada context/provider kullanmıyor; build/SSG'e zorlamıyor.</p>
    </main>
  );
}

function Card({ title, good, detail }: { title: string; good: boolean; detail: string }) {
  return (
    <div style={{border:'1px solid #e5e7eb', borderRadius:12, padding:12}}>
      <div style={{display:'flex', alignItems:'center', gap:8}}>
        <span style={{
          display:'inline-block', width:10, height:10, borderRadius:9999,
          backgroundColor: good ? '#10b981' : '#ef4444'
        }} />
        <b>{title}</b>
      </div>
      <div style={{marginTop:8, fontSize:12, opacity:.8}}>{detail}</div>
    </div>
  );
}
