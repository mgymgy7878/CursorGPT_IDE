import { NextRequest, NextResponse } from 'next/server';

const ALLOW = new Set([
  'params/pending',
  'params/approve',
  'params/deny',
  'params/audit',
]);

const BASE = process.env.EXECUTOR_BASE_URL || 'http://127.0.0.1:4001';

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  const sub = params.path.join('/');
  if (!ALLOW.has(sub)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const url = `${BASE}/guardrails/${sub}`;
  const res = await fetch(url, {
    headers: {
      'x-role': req.headers.get('x-role') || '',
      'x-actor': req.headers.get('x-actor') || '',
    },
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  const sub = params.path.join('/');
  if (!ALLOW.has(sub)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const url = `${BASE}/guardrails/${sub}`;
  const body = await req.text();
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': req.headers.get('content-type') || 'application/json',
      'x-role': req.headers.get('x-role') || '',
      'x-actor': req.headers.get('x-actor') || '',
    },
    body,
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
