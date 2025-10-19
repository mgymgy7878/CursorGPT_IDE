import fetch from "node-fetch";

export type Kline = { t:number; o:number; h:number; l:number; c:number; v:number };

// BTCTurk public OHLC endpoint (MVP: hourly/daily). Gerekirse proxy/adapter ile genişletilecek.
export async function fetchBtcturkOhlc(pair:string, period:string="1", last:string="1000"):Promise<Kline[]>{
  const url = `https://api.btcturk.com/api/v2/ohlc?pairSymbol=${pair}&period=${period}&last=${last}`;
  const res = await fetch(url); 
  const j = await res.json();
  return ((j as any)?.data||[]).map((x:any)=>({ t:x.T*1000, o:x.O, h:x.H, l:x.L, c:x.C, v:x.V }));
}

