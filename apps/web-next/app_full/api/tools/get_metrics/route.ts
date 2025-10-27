import { NextRequest, NextResponse } from 'next/server';
import { extractBearer, verifyToken } from '@spark/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const timestamp = Date.now();
  const token = extractBearer(request.headers.get('authorization'));
  const auth = verifyToken(token || '');
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized', timestamp }, { status: 401 });

  const host = request.headers.get('host') || '127.0.0.1:3003';
  const proto = request.headers.get('x-forwarded-proto') || 'http';
  const base = `${proto}://${host}`;
  let body = '';
  try {
    const res = await fetch(`${base}/api/public/metrics`, { cache: 'no-store' });
    body = await res.text();
  } catch { /* ignore */ }

  return new Response(body, { status: 200, headers: { 'Content-Type': 'text/plain; version=0.0.4', 'Cache-Control': 'no-store' } });
}


