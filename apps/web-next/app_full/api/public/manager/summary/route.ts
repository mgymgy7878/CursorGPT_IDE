import { NextResponse } from "next/server";

export const revalidate = 0;

const EXEC = process.env.EXEC_ORIGIN ?? 'http://127.0.0.1:4001';

async function fetchJson(url: string, timeoutMs = 1500) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { cache: 'no-store', signal: ctl.signal });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } finally { clearTimeout(t) }
}

export async function GET() {
  const headers = new Headers({ 'Cache-Control': 'no-store' });

  // Executor'dan dene
  try {
    const data = await fetchJson(`${EXEC}/manager/summary`, 1500);
    return NextResponse.json({ ok: true, source: 'executor', data }, { headers });
  } catch {}

  // Mock summary
  const mockData = {
    period: 'günlük',
    ts: new Date().toISOString(),
    trading: {
      mode: 'trend',
      activePositions: 3,
      totalTrades: 42,
      winRate: 0.65,
      avgWin: 125.50,
      avgLoss: -85.30
    },
    performance: {
      dailyPnL: 1250.75,
      weeklyPnL: 8750.25,
      monthlyPnL: 32500.50,
      sharpeRatio: 1.85,
      maxDrawdown: -8.5
    },
    risk: {
      currentExposure: 15.2,
      dailyRisk: 0.5,
      leverage: 2.1,
      marginUsed: 12500
    },
    alerts: [
      { type: 'info', message: 'BTCUSDT trend sinyali güçlü' },
      { type: 'warning', message: 'ETHUSDT pozisyonu %80 doluluk' }
    ]
  };

  return NextResponse.json({ ok: true, source: 'mock', data: mockData }, { headers });
} 