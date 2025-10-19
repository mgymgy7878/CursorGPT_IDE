export const runtime = "nodejs";

type Body = { action: string; params?: any };

export async function POST(req: Request) {
  const { action, params } = (await req.json()) as Body;

  if (action === 'tools/fibonacci_levels') {
    const levels = [0,0.236,0.382,0.5,0.618,0.786,1].map(r => ({ ratio: r, price: 1000 + r * 100 }));
    return json({ levels, high: 1100, low: 900 });
  }
  if (action === 'tools/bollinger_bands') {
    const { period = 20, stdDev = 2 } = params || {};
    return json({ current: { u: 1050, m: 1000, l: 950 }, period, stdDev, series: new Array(200).fill(0).map((_,i)=>({ u: 1000+50*Math.sin(i/10), m: 1000, l: 1000-50*Math.sin(i/10) })) });
  }
  if (action === 'tools/macd') {
    return json({ macd: [0.1,0.2,0.05], signal: [0.08,0.18,0.1], histogram: [0.02,0.02,-0.05] });
  }
  if (action === 'tools/stochastic') {
    return json({ k: [20,40,80,60], d: [30,50,70,65] });
  }
  if (action === 'strategy/validate') {
    const ok = typeof params?.code === 'string' && params.code.includes('function');
    return json({ ok, hints: ok ? [] : ['Kod bir function içermeli'] });
  }
  if (action === 'optimize/ema') {
    const best = { emaFast: 21, emaSlow: 55, sharpe: 1.62, pnl: 1234.56 };
    return json({ ok: true, best });
  }
  if (action === 'alerts/create') {
    return json({ ok: true, id: Math.random().toString(16).slice(2) });
  }
  if (action === 'notify/test') {
    return json({ ok: true });
  }

  return json({ error: 'unknown_action' }, 400);
}

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });
}


