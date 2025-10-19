import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest){
  try{
    const body = await req.json().catch(()=>({}));
    const r = await fetch('http://127.0.0.1:3003/api/backtest/run', { method:'POST', headers:{ 'content-type':'application/json', 'X-Spark-Actor':'ui', 'X-Spark-Source':'strategy-lab' }, body: JSON.stringify(body) });
    const j = await r.json().catch(()=>({ ok:false }));
    return NextResponse.json({ ok: r.ok, result: j?.result ?? j }, { status: r.ok? 200 : r.status });
  }catch{ return NextResponse.json({ ok:false }, { status:500 }); }
}


