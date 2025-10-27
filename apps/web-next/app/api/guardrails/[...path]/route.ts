import { NextRequest, NextResponse } from 'next/server';

const BASE = process.env.EXECUTOR_BASE_URL!;

function join(u: string, p: string) {
  return u.replace(/\/+$/, '') + '/' + p.replace(/^\/+/, '');
}

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  const target = new URL(join(BASE, params.path.join('/')));
  req.nextUrl.searchParams.forEach((v, k) => target.searchParams.set(k, v));
  const r = await fetch(target, { headers: { 'X-Actor': req.headers.get('x-actor') || 'web' } });
  const body = await r.text();
  return new NextResponse(body, { status: r.status, headers: { 'Content-Type': r.headers.get('content-type') || 'application/json' } });
}

export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  const target = join(BASE, params.path.join('/'));
  const r = await fetch(target, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Actor': req.headers.get('x-actor') || 'web' },
    body: await req.text()
  });
  const body = await r.text();
  return new NextResponse(body, { status: r.status, headers: { 'Content-Type': r.headers.get('content-type') || 'application/json' } });
}
