import { NextResponse } from 'next/server';

export async function GET(req: Request){
  try{
    const url = new URL(req.url);
    const cursor = url.searchParams.get('cursor') || '';
    const limit = url.searchParams.get('limit') || '20';
    const etag = (req as any).headers?.get?.('if-none-match');
    const r = await fetch(`http://127.0.0.1:4001/util/smoke/history/stream?limit=${encodeURIComponent(limit)}&cursor=${encodeURIComponent(cursor)}`, { cache: 'no-store' as any, headers: etag? { 'if-none-match': etag } : undefined });
    if(r.status === 304){ return new NextResponse(null, { status: 304 }); }
    if(!r?.ok){ return NextResponse.json({ ok:false }, { status: 503 }); }
    const j = await r.json();
    const resp = NextResponse.json(j);
    const et = r.headers.get('etag'); if(et) resp.headers.set('etag', et);
    return resp;
  }catch{
    return NextResponse.json({ ok:false }, { status: 503 });
  }
}


