import { NextResponse } from 'next/server';

const B = process.env.EXECUTOR_BASE_URL;

export async function GET() {
  if (!B) {
    return NextResponse.json([
      { id: 's1', name: 'SMA Cross', symbol: 'BTCUSDT', status: 'stopped', createdAt: new Date().toISOString() },
      { id: 's2', name: 'RSI Mean Revert', symbol: 'ETHUSDT', status: 'running', createdAt: new Date().toISOString() },
    ]);
  }
  const r = await fetch(`${B}/api/strategies`, { cache: 'no-store' });
  const data = await r.json();
  return NextResponse.json(data, { status: r.status });
}

export async function POST(req: Request) {
  const body = await req.json();
  if (!B) {
    return NextResponse.json({ id: crypto.randomUUID(), ...body, status: 'draft', createdAt: new Date().toISOString() }, { status: 201 });
  }
  const r = await fetch(`${B}/api/strategies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await r.json();
  return NextResponse.json(data, { status: r.status });
}
