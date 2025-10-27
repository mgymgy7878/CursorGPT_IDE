"use client";
import { useEffect, useRef, useState } from "react";
export default function TickerWidget({ symbol="btcusdt" }: { symbol?: string }) {
  const [price, setPrice] = useState<string>("—");
  const wsRef = useRef<WebSocket | null>(null);
  useEffect(() => {
    const url = `wss://stream.binance.com:9443/ws/${symbol}@trade`;
    const ws = new WebSocket(url); wsRef.current = ws;
    ws.onmessage = (e) => { try { const j = JSON.parse(e.data); if (j.p) setPrice(j.p); } catch {} };
    return () => { try { ws.close(); } catch {} };
  }, [symbol]);
  return (
    <div className="rounded-2xl border border-neutral-800 p-4">
      <div className="text-xs uppercase text-neutral-400">Ticker</div>
      <div className="mt-1 text-2xl font-semibold">{symbol.toUpperCase()} <span className="text-neutral-400 text-base">{price}</span></div>
    </div>
  );
} 