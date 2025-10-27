export type BacktestRequest = {
  code: string;
  params?: Record<string, any>;
};
export type BacktestPoint = { t: number; equity: number };
export type BacktestResponse = {
  points: BacktestPoint[];
  stats: { totalReturn?: number; maxDD?: number; winRate?: number };
};

export async function runBacktest(body: BacktestRequest): Promise<BacktestResponse> {
  try {
    const res = await fetch("/api/exec/backtest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    // MOCK fallback – UI akışını doğrulamak için
    const now = Date.now();
    const points = Array.from({ length: 60 }, (_, i) => ({
      t: now - (60 - i) * 60_000,
      equity: 10000 + Math.sin(i / 6) * 200 + i * 5,
    }));
    return { points, stats: { totalReturn: 0.12, maxDD: -0.05, winRate: 0.56 } };
  }
}

export type OptimizeResponse = { rows: Record<string, any>[]; best?: Record<string, any> | null };

export async function runOptimize(body: { code: string; grid?: any }): Promise<OptimizeResponse> {
  try {
    const res = await fetch("/api/exec/optimize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    // mock fallback
    return {
      rows: [
        { rsiLen: 7, th: 30, totalReturn: 0.11, maxDD: -0.07, winRate: 0.55 },
        { rsiLen: 14, th: 28, totalReturn: 0.16, maxDD: -0.08, winRate: 0.57 },
      ],
      best: { rsiLen: 14, th: 28 },
    };
  }
}

const hdr = () => {
  const t = process.env.NEXT_PUBLIC_EXEC_API_TOKEN;
  const headers: Record<string, string> = { 'Content-Type':'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  return headers;
};
export async function execStart(id: string, name?: string){ 
  const r = await fetch('/api/exec/start',{method:'POST',headers:hdr(), body: JSON.stringify({id,name})});
  return r.json();
}
export async function execPause(id: string){
  const r = await fetch('/api/exec/pause',{method:'POST',headers:hdr(), body: JSON.stringify({id})});
  return r.json();
}
export async function execStop(id: string){
  const r = await fetch('/api/exec/stop',{method:'POST',headers:hdr(), body: JSON.stringify({id})});
  return r.json();
}
export async function execList(){
  const r = await fetch('/api/exec/list'); return r.json();
}


export async function testBinanceConnection(apiKey: string, apiSecret: string) {
  const token = process.env.NEXT_PUBLIC_EXEC_API_TOKEN;
  const res = await fetch('/api/exec/test/binance', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ apiKey, apiSecret }),
  });
  if (!res.ok) throw new Error(`Binance test failed: ${res.status}`);
  return res.json();
}

export async function testBtcturkConnection(apiKey: string, apiSecret: string) {
  const token = process.env.NEXT_PUBLIC_EXEC_API_TOKEN;
  const res = await fetch('/api/exec/test/btcturk', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ apiKey, apiSecret }),
  });
  if (!res.ok) throw new Error(`BTCTurk test failed: ${res.status}`);
  return res.json();
}


