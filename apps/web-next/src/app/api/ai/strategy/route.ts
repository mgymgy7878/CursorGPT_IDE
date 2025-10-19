import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest){
  try{
    const body = await req.json().catch(()=>({}));
    const r = await fetch('http://127.0.0.1:3003/api/advisor/suggest', { method:'POST', headers:{ 'content-type':'application/json', 'X-Spark-Actor':'ui', 'X-Spark-Source':'strategy-lab' }, body: JSON.stringify({ action:'ai.strategy', params: body, dryRun:true, confirm_required:false, reason:'strategy-lab ai' }) });
    const j = await r.json().catch(()=>({ ok:false }));
    return NextResponse.json({ ok: r.ok, patch: j?.patch, notes: j?.notes }, { status: r.ok? 200 : r.status });
  }catch{ return NextResponse.json({ ok:false }, { status:500 }); }
}


