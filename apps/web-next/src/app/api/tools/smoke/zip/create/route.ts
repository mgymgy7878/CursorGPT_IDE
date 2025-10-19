import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest){
  try{
    const token = process.env.SMOKE_TOKEN ?? '';
    const last = await fetch('http://127.0.0.1:4001/util/smoke/last', { cache: 'no-store' as any }).then(r=>r.json()).catch(()=>null);
    const path = last?.path as string|undefined; if(!path) return NextResponse.json({ ok:false }, { status: 404 });
    const dir = path.split('/').pop(); if(!dir) return NextResponse.json({ ok:false }, { status: 404 });
    const res = await fetch(`http://127.0.0.1:4001/util/smoke/zip?dir=${encodeURIComponent(dir)}&create=1`, { headers: { 'X-Spark-Token': token, 'X-Spark-Actor': 'ui' } });
    if(!res.ok) return NextResponse.json({ ok:false }, { status: res.status });
    return new NextResponse(res.body as any, { headers: { 'Content-Type': res.headers.get('content-type') ?? 'application/zip', 'Content-Disposition': res.headers.get('content-disposition') ?? `attachment; filename="${dir}.zip"` } });
  }catch{
    return NextResponse.json({ ok:false }, { status: 500 });
  }
}


