export const runtime = "nodejs";
const EXEC = process.env.EXECUTOR_URL ?? "http://localhost:4001";

export async function GET(req: Request){
  const url = new URL(req.url);
  const jobId = url.searchParams.get('jobId') || 'demo';
  try{
    const r = await fetch(`${EXEC}/optimizer/progress?jobId=${encodeURIComponent(jobId)}`).catch(()=>null);
    if(r && r.ok){
      return new Response(await r.text(), { status:r.status, headers:{ 'content-type': r.headers.get('content-type') ?? 'application/json', 'cache-control':'no-store' } });
    }
  }catch{}
  // Fallback mock
  const pct = Math.min(100, Math.floor(Date.now()/2000)%101);
  const status = pct>=100? 'done' : 'running';
  const best = pct>50? { emaFast:21, emaSlow:55, sharpe:1.6 } : undefined;
  return new Response(JSON.stringify({ pct, status, best }), { status:200, headers:{ 'content-type':'application/json', 'cache-control':'no-store' } });
}


