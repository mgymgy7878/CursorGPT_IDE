import { NextResponse } from 'next/server';

const EXECUTOR_URL = process.env.EXECUTOR_URL || 'http://127.0.0.1:4001';

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const token = process.env.ADMIN_TOKEN || '';

    if (!token) {
      return NextResponse.json(
        { ok: false, error: 'ADMIN_TOKEN not configured' },
        { status: 401 }
      );
    }

    const r = await fetch(`${EXECUTOR_URL}/admin/ai/providers/set`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': token,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    }).catch(() => null);

    if (!r) {
      return NextResponse.json(
        { ok: false, error: 'Executor unreachable' },
        { status: 503 }
      );
    }

    const j = await r.json().catch(() => ({ ok: false, error: 'parse error' }));
    return NextResponse.json(j, { status: r.status });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message || 'unknown error' },
      { status: 500 }
    );
  }
}

