import fetch from "node-fetch";

export type Kline = { t:number; o:number; h:number; l:number; c:number; v:number };

export async function fetchBinanceKlines(symbol:string, interval:string, start:number, end:number, futures=false):Promise<Kline[]>{
  const base = futures ? "https://fapi.binance.com" : "https://api.binance.com";
  const url = `${base}/${futures?"fapi":"api"}/v1/klines?symbol=${symbol}&interval=${interval}&startTime=${start}&endTime=${end}&limit=1000`;
  const res = await fetch(url); 
  const arr = await res.json();
  return (arr as any[]||[]).map((x:any)=>({ t:x[0], o:+x[1], h:+x[2], l:+x[3], c:+x[4], v:+x[5] }));
}

// Wrapper for cache integration
export async function loadBinanceHistory(symbol:string, timeframe:string, since:number, until:number) {
  const klines = await fetchBinanceKlines(symbol, timeframe, since, until, false);
  return klines.map(k => ({
    exchange: 'binance',
    symbol,
    timeframe,
    ts: k.t,
    open: k.o,
    high: k.h,
    low: k.l,
    close: k.c,
    volume: k.v
  }));
}

