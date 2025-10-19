import { NextResponse } from 'next/server';

/**
 * /api/public/smoke-last - Last smoke test result
 * Graceful degradation: Returns 200 with _mock flag on executor offline
 */
export async function GET(){
  try{
    const r = await fetch('http://127.0.0.1:4001/util/smoke/last', { 
      cache: 'no-store' as any,
      signal: AbortSignal.timeout(3000) // 3s timeout
    });
    
    if(!r?.ok) {
      // Executor offline - return 200 with mock flag
      return NextResponse.json({ 
        _mock: true, 
        path: 'demo/smoke-test',
        _err: `executor_http_${r.status}` 
      }, { status: 200 });
    }
    
    const j = await r.json();
    return NextResponse.json(j);
  }catch(e: any){
    // Network error or timeout - return 200 with mock flag
    return NextResponse.json({ 
      _mock: true, 
      path: 'demo/smoke-test',
      _err: e?.message || 'executor_offline' 
    }, { status: 200 });
  }
}


