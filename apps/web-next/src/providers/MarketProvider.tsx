"use client";
import React, { useEffect } from "react";
import { useMarketStore } from "../stores/marketStore";

type ConnectOpts = { onTick: (t:{symbol:string,price:number,ts:number,source?:'binance'|'btcturk'|'mock'})=>void; onReconnect: ()=>void }

function connectBinance(url: string, opts: ConnectOpts){
  const ws = new WebSocket(url);
  ws.onopen = () => {};
  ws.onmessage = (ev) => {
    try{
      const d = JSON.parse(String(ev.data));
      // beklenen format: { s, p } – örnek basitleştirme
      const s = d.s || d.symbol; const p = Number(d.p || d.price);
      if(s && Number.isFinite(p)) opts.onTick({ symbol: s, price: p, ts: Date.now(), source:'binance' });
    }catch{}
  };
  ws.onclose = () => { opts.onReconnect() };
  ws.onerror = () => { try{ ws.close() }catch{} };
  return () => { try{ ws.close() }catch{} };
}

function connectMock(opts: ConnectOpts){
  let timer:number|undefined;
  const symbols = ["BTCUSDT","ETHUSDT","BNBUSDT","SOLUSDT","XRPUSDT","ADAUSDT","AVAXUSDT","DOGEUSDT","DOTUSDT"];
  const tick = () => {
    const now = Date.now();
    for(const s of symbols){
      const base = 100 + Math.random()*5;
      opts.onTick({ symbol:s, price: Number(base.toFixed(2)), ts: now, source:'mock' });
    }
    timer = window.setTimeout(tick, 1000);
  };
  tick();
  return () => { if(timer) window.clearTimeout(timer) };
}

export default function MarketProvider({ children }: { children: React.ReactNode }) {
  const setTicker = useMarketStore(s => s.setTicker);
  const markStatus = useMarketStore(s => s.markStatus);
  useEffect(() => {
    const USE_MOCK = process.env.NEXT_PUBLIC_WS_MOCK === "1";
    const url = process.env.NEXT_PUBLIC_WS_BINANCE as string | undefined;
    const close = USE_MOCK
      ? connectMock({ onTick: setTicker, onReconnect: () => markStatus('degraded') })
      : url
        ? connectBinance(url, { onTick: setTicker, onReconnect: () => markStatus('degraded') })
        : connectMock({ onTick: setTicker, onReconnect: () => markStatus('degraded') });
    return () => close?.();
  }, [setTicker, markStatus]);
  return <>{children}</>;
}


