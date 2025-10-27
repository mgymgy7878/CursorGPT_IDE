"use client";
import { useEffect, useState } from "react";

export default function TickerWidgetExecutor() {
  const [price, setPrice] = useState<string>("—");
  const [connected, setConnected] = useState<boolean>(false);
  const [ts, setTs] = useState<number | null>(null);

  useEffect(() => {
    let es: EventSource | null = null;
    try {
      es = new EventSource("/api/local/market/stream");
      es.onopen = () => setConnected(true);
      es.onmessage = (ev) => {
        try {
          const j = JSON.parse(ev.data);
          if (typeof j.price === "number") {
            setPrice(j.price.toString());
            setTs(j.ts || Date.now());
          } else if (j.ready) {
            setConnected(true);
          }
        } catch {}
      };
      es.onerror = () => setConnected(false);
    } catch {
      setConnected(false);
    }
    return () => { es?.close(); };
  }, []);

  return (
    <div className="rounded-2xl border border-neutral-800 p-4">
      <div className="text-xs uppercase text-neutral-400">Executor Ticker</div>
      <div className="mt-1 text-2xl font-semibold">BTCUSDT <span className="text-neutral-400 text-base">{price}</span></div>
      <div className="text-xs text-neutral-500 mt-1">{connected ? "stream: connected" : "stream: disconnected"}{ts ? ` · ${new Date(ts).toLocaleTimeString()}` : ""}</div>
    </div>
  );
} 