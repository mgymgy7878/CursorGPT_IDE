import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const origin = process.env.EXECUTOR_ORIGIN || 'http://127.0.0.1:4001';
  const token  = process.env.EXEC_API_TOKEN;
  const body   = await req.text();

  const res = await fetch(`${origin}/api/ai/strategies/generate`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {})
    },
    body
  });

  return new NextResponse(res.body, { status: res.status, headers: res.headers as any });
}
