export const runtime = "nodejs";
const EXEC = process.env.EXECUTOR_URL ?? "http://localhost:4001";

export async function GET(req: Request){
  const url = new URL(req.url);
  const jobId = url.searchParams.get('jobId') || 'demo';

  // Try proxy first
  try{
    const r = await fetch(`${EXEC}/optimizer/progress/stream?jobId=${encodeURIComponent(jobId)}`, { headers:{ accept: 'text/event-stream' } });
    if(r.ok){
      // Pipe through (simple passthrough)
      const body = r.body as any;
      return new Response(body, { status:200, headers:{ 'content-type':'text/event-stream', 'cache-control':'no-store', 'connection':'keep-alive' } });
    }
  }catch{}

  // Local mock SSE
  const stream = new ReadableStream({
    start(controller){
      let pct = 0;
      const iv = setInterval(()=>{
        pct = Math.min(100, pct + Math.floor(Math.random()*10)+5);
        const evt = pct>=100 ? { type:'completed' } : { type:'progress', pct };
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(evt)}\n\n`));
        if(pct>=100){ clearInterval(iv); controller.close(); }
      }, 1000);
    }
  });
  return new Response(stream, { status:200, headers:{ 'content-type':'text/event-stream', 'cache-control':'no-store', 'connection':'keep-alive' } });
}


