import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.text();
  const ORIGIN = process.env.EXECUTOR_ORIGIN || 'http://127.0.0.1:4001';
  const r = await fetch(`${ORIGIN}/api/futures/order`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
  });
  const text = await r.text();
  return new NextResponse(text, { status: r.status, headers: { 'content-type': r.headers.get('content-type') ?? 'application/json' }});
}
