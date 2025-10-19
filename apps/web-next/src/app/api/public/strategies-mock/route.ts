import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

type Strat = { id: string; name: string; symbol: string; timeframe: string; status: string } & Record<string, any>;

let STRATS: Strat[] = [
  { id: 's-1', name: 'BTC 15m TF', symbol: 'BTCUSDT', timeframe: '15m', status: 'idle' },
  { id: 's-2', name: 'ETH Swing', symbol: 'ETHUSDT', timeframe: '1h', status: 'active' },
];

export async function GET() {
  return NextResponse.json({ items: STRATS, total: STRATS.length });
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const action = url.searchParams.get('action') ?? 'create';
  const body = await req.json().catch(() => ({} as any));

  if (action === 'create') {
    const id = `s-${Date.now()}`;
    const s: Strat = { id, status: 'idle', ...body };
    STRATS.unshift(s);
    return NextResponse.json({ ok: true, item: s });
  }
  if (action === 'update') {
    const { id, ...rest } = body || {};
    STRATS = STRATS.map((s) => (s.id === id ? { ...s, ...rest } : s));
    return NextResponse.json({ ok: true });
  }
  if (action === 'delete') {
    const { id } = body || {};
    STRATS = STRATS.filter((s) => s.id !== id);
    return NextResponse.json({ ok: true });
  }
  if (action === 'status') {
    const { id, status } = body || {};
    STRATS = STRATS.map((s) => (s.id === id ? { ...s, status } : s));
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, error: 'unknown action' }, { status: 400 });
}

// duplicate handler removed
