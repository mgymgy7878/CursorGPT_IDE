import { NextResponse } from "next/server";
export const revalidate = 0;

async function safePost(url: string, body: any, ms = 1500) {
  const c = new AbortController();
  const to = setTimeout(() => c.abort(), ms);
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: c.signal,
      cache: 'no-store'
    });
    clearTimeout(to);
    if (!r.ok) throw new Error(String(r.status));
    return r.json();
  } catch (e) {
    clearTimeout(to);
    throw e;
  }
}

export async function POST(req: Request) {
  const headers = new Headers({ 'Cache-Control': 'no-store' });
  const exec = process.env.EXEC_ORIGIN;
  const payload = await req.json().catch(() => ({}));
  
  if (exec) {
    try {
      const data = await safePost(`${exec}/lab/backtest`, payload);
      return NextResponse.json({ ok: true, source: 'executor', ...data }, { headers });
    } catch {
      /* fall through */
    }
  }
  
  // Evidence/mock fallback
  return NextResponse.json({
    ok: true,
    source: 'evidence',
    metrics: {
      sharpe: 0.84,
      pnl: 1234.56,
      win: 0.58,
      maxdd: 0.124,
      trades: 45
    },
    equity: [
      { ts: 1, eq: 10000 },
      { ts: 2, eq: 10120 },
      { ts: 3, eq: 10250 },
      { ts: 4, eq: 10380 },
      { ts: 5, eq: 10500 }
    ],
  }, { headers });
} 