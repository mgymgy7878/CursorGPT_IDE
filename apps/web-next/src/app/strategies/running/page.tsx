"use client";
import useSWR from "swr";
import { useEffect, useMemo, useRef, useState } from "react";
import { RunningStrategy, StrategyWsEvent } from "@/types/strategy";
import RunningList from "@/components/running/RunningList";
import { useWebSocket } from "@/lib/useWebSocket";
const fetcher = (u:string)=>fetch(u).then(r=>r.json());

export default function RunningStrategiesPage() {
  const { data, isLoading, mutate } = useSWR<RunningStrategy[]>("/api/strategies/running", fetcher, { refreshInterval: 30000 });
  const [rows, setRows] = useState<RunningStrategy[]>([]);
  const historyRef = useRef<Record<string,{ts:number; pnl:number}[]>>({});

  // ilk veri
  useEffect(()=>{ if (data) setRows(data); }, [data]);

  // WS canlı güncellemeler
  const wsUrl = (process.env.NEXT_PUBLIC_WS_URL || "").replace(/^http/, "ws"); // güvenli dönüşüm
  const { message, connected } = useWebSocket(wsUrl, {
    topics: ['strategyUpdates'],
  });

  useEffect(() => {
    if (!message?.payload) return;
    
    try {
      const ev: StrategyWsEvent = message.payload;
      setRows((prev) => {
        if (!ev || !("type" in ev)) return prev;
        return prev.map(s => {
          if (s.id !== (ev as any).id) return s;
          if (ev.type === "pnl") {
            // sparkline hafızası
            const arr = historyRef.current[s.id] ||= [];
            arr.push({ ts: ev.ts, pnl: ev.pnl });
            if (arr.length > 120) arr.shift();
            return { ...s, pnl: ev.pnl };
          }
          if (ev.type === "status") return { ...s, status: ev.status };
          if (ev.type === "latency") return { ...s, latencyMs: ev.p95 };
          return s;
        });
      });
    } catch {}
  }, [message]);

  const series = useMemo(()=>historyRef.current, [rows]); // PLSparkline için

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Çalışan Stratejiler</h1>
          <p className="text-sm opacity-70">Gerçek zamanlı P/L ve durum.</p>
        </div>
        <button className="rounded-xl border px-3 py-2" onClick={()=>mutate()}>Yenile</button>
      </div>

      {isLoading ? (
        <div className="h-40 animate-pulse rounded-2xl border" />
      ) : (
        <RunningList rows={rows} series={series} onChanged={()=>mutate()} />
      )}
    </div>
  );
}
