import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const size = Number(searchParams.get('size') ?? 50);
  const now = Date.now();
  const items = Array.from({ length: size }, (_, i) => ({
    time: new Date(now - i * 60_000).toISOString(),
    actor: i % 3 === 0 ? 'ui' : 'executor',
    action: i % 5 === 0 ? 'order.place' : 'strategy.update',
    target: i % 2 === 0 ? 'BTCUSDT' : 'ETHUSDT',
    status: i % 10 === 0 ? 'error' : (i % 6 === 0 ? 'warn' : 'ok'),
    auditId: `AUD-${now}-${i}`,
  }));
  return NextResponse.json({ items, total: 5000 });
}


