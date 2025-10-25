import { NextResponse } from 'next/server';

export async function GET() {
  const base = process.env.NEXT_PUBLIC_EXECUTOR_BASE || 'http://127.0.0.1:4001';
  try {
    const r = await fetch(`${base}/error-budget/summary`, { cache: 'no-store' });
    const j = await r.json();
    return NextResponse.json(j, { status: 200 });
  } catch {
    return NextResponse.json({ _err: 'executor-unavailable' }, { status: 200 });
  }
}

