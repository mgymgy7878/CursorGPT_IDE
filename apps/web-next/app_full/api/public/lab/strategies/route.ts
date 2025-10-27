export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const ctl = new AbortController();
  const t = setTimeout(()=>ctl.abort('timeout'), 1500);
  
  try {
    const qs = req.nextUrl.searchParams.toString();
    const url = `${process.env.EXEC_URL ?? 'http://127.0.0.1:4001'}/lab/strategies${qs ? `?${qs}`:''}`;
    const res = await fetch(url, { 
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