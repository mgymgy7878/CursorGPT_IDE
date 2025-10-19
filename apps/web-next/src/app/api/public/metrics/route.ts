import { NextResponse } from 'next/server';

/**
 * /api/public/metrics - Prometheus metrics proxy
 * Graceful degradation: Returns 200 with _mock flag on executor offline
 */
export async function GET() {
  try{
    const r = await fetch('http://127.0.0.1:4001/metrics', { 
      cache: 'no-store' as any,
      signal: AbortSignal.timeout(3000) // 3s timeout
    });
    
    if(!r?.ok){ 
      // Executor offline or error - return 200 with mock flag
      return NextResponse.json({ 
        _mock: true, 
        status: 'DEMO',
        _err: `executor_http_${r.status}` 
      }, { status: 200 });
    }
    
    const txt = await r.text();
    return new NextResponse(txt, { 
      headers: { 'Content-Type': 'text/plain; charset=utf-8' } 
    });
  }catch(e: any){
    // Network error or timeout - return 200 with mock flag
    return NextResponse.json({ 
      _mock: true, 
      status: 'DEMO',
      _err: e?.message || 'executor_offline' 
    }, { status: 200 });
  }
}


