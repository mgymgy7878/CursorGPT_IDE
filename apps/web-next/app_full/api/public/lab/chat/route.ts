import { NextRequest } from "next/server";
export const revalidate = 0;
export async function POST(req: NextRequest) {
  const origin = process.env.EXECUTOR_ORIGIN;
  try {
    const body = await req.json().catch(()=> ({}));
    if (!origin) throw new Error('EXECUTOR_ORIGIN not set');
    const targets = [`${origin.replace(/\/$/,'')}/lab/chat`, `${origin.replace(/\/$/,'')}/ai/chat`];
    let lastErr: any = null;
    for (const url of targets) {
      try {
        const r = await fetch(url, { method:'POST', cache:'no-store', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
        if (r.ok) return new Response(await r.text(), { status: 200, headers: { 'Content-Type':'application/json' }});
      } catch (e){ lastErr = e; }
    }
    throw lastErr ?? new Error('upstream_unreachable');
  } catch (e:any) {
    return new Response(JSON.stringify({ ok:false, error:'upstream_unreachable' }), { status: 502, headers:{'Content-Type':'application/json'} });
  }
} 