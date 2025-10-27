export async function getKlines(symbol: string, interval: string, start: number, end: number) {
  const url = new URL('https://api.binance.com/api/v3/klines');
  url.searchParams.set('symbol', symbol);
  url.searchParams.set('interval', interval);
  url.searchParams.set('startTime', String(start));
  url.searchParams.set('endTime', String(end));
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!res.ok) throw new Error(`binance klines ${res.status}`);
  const raw = await res.json() as any[];
  return raw.map(k => ({
    openTime: k[0],
    open: Number(k[1]), high: Number(k[2]), low: Number(k[3]), close: Number(k[4]),
    volume: Number(k[5]), closeTime: k[6]
  }));
} 