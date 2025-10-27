export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const ctl = new AbortController();
  const t = setTimeout(()=>ctl.abort('timeout'), 1500);
  
  try {
    const body = await req.json();
    const res = await fetch(`${process.env.EXEC_URL ?? 'http://127.0.0.1:4001'}/lab/save`, {
      method:'POST', 
      headers:{'content-type':'application/json'},
      body: JSON.stringify(body), 
      cache:'no-store', 
      signal: ctl.signal
    });
    const data = await res.json();
    return new Response(JSON.stringify(data), { 
      status: res.status, 
      headers:{'Cache-Control':'no-store'} 
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok:false, degraded:true, error:String(e) }), { status: 504 });
  } finally { 
    clearTimeout(t); 
  }
} 