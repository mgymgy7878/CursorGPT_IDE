import { NextResponse } from 'next/server';

/**
 * /api/public/alert/last - Last alarm status
 * Graceful degradation: Returns 200 with DEMO status on executor offline
 */
export async function GET(){
  try{
    const r = await fetch('http://127.0.0.1:4001/metrics', { 
      cache: 'no-store' as any,
      signal: AbortSignal.timeout(3000) // 3s timeout
    });
    
    if(!r?.ok){ 
      // Executor offline - return 200 with DEMO status
      return NextResponse.json({ 
        _mock: true, 
        status: 'DEMO',
        _err: `executor_http_${r.status}` 
      }, { status: 200 });
    }
    
    const txt = await r.text();
    const val = (name:string)=>{ const m = txt.match(new RegExp(`^${name}\\s+([0-9.]+)\\s*$`, 'm')); return m? Number(m[1]): null; };
    const exit = val('spark_smoke_exit_code');
    const p95  = val('spark_smoke_p95_latency_ms');
    const st   = val('spark_smoke_staleness_seconds');
    const ok = exit===0 && (p95==null || p95<=1200) && (st==null || st<=30);
    const sev = (exit && exit!==0)? 'alert' : (p95!=null && p95>2400? 'alert' : (p95!=null && p95>1200? 'warn':'ok'));
    
    return NextResponse.json({ 
      ok:true, 
      status: ok? 'OK' : (sev==='warn'?'WARN':'ALERT'), 
      metrics:{ exitCode:exit, p95Ms:p95, stalenessS:st } 
    });
  }catch(e: any){
    // Network error or timeout - return 200 with DEMO status
    return NextResponse.json({ 
      _mock: true, 
      status: 'DEMO',
      _err: e?.message || 'executor_offline' 
    }, { status: 200 });
  }
}


