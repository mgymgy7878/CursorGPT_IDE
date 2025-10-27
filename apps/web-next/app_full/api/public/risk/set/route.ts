import { NextResponse } from "next/server";

export const revalidate = 0;

const EXEC = process.env.EXEC_ORIGIN ?? 'http://127.0.0.1:4001';

async function fetchJson(url: string, options: RequestInit = {}, timeoutMs = 1500) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { 
      ...options, 
      cache: 'no-store', 
      signal: ctl.signal 
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } finally { clearTimeout(t) }
}

export async function POST(request: Request) {
  const headers = new Headers({ 'Cache-Control': 'no-store' });

  try {
    const body = await request.json();
    const { percent } = body;

    if (typeof percent !== 'number' || percent < 0 || percent > 100) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Invalid risk percentage (0-100)',
        source: 'none' 
      }, { status: 400, headers });
    }

    // Executor'a gönder
    try {
      const data = await fetchJson(`${EXEC}/risk/set`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ percent })
      }, 1500);
      return NextResponse.json({ ok: true, source: 'executor', data }, { headers });
    } catch {}

    // Mock response
    const mockData = {
      percent,
      status: 'updated',
      ts: new Date().toISOString(),
      message: `Risk %${percent} olarak ayarlandı`,
      limits: {
        dailyMaxLoss: percent,
        perTradeRisk: percent / 2,
        maxLeverage: 100 / percent
      }
    };
    return NextResponse.json({ ok: true, source: 'mock', data: mockData }, { headers });

  } catch (error) {
    return NextResponse.json({ 
      ok: false, 
      error: 'Invalid request body',
      source: 'none' 
    }, { status: 400, headers });
  }
} 