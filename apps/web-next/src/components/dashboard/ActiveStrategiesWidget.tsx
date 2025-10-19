"use client";
import { useEffect, useState } from "react";
import { asStr } from "@/lib/safe";
import { fetchStrategies } from "@/lib/api-client";

type Item = { id: string; symbol: string; status: "running"|"stopped"; pnl?: number };

export default function ActiveStrategiesWidget() {
  const [items, setItems] = useState<Item[]>([]);
  const [isMock, setIsMock] = useState(false);
  
  useEffect(() => {
    loadStrategies();
    // Auto-refresh every 5 seconds
    const interval = setInterval(loadStrategies, 5000);
    return () => clearInterval(interval);
  }, []);

  async function loadStrategies() {
    const result = await fetchStrategies();
    
    if (result.ok && result.data) {
      const items = (result.data.items || []).map((x: any, i: number) => ({
        id: x.id || `o${i}`,
        symbol: x.symbol || x.sym || "UNKNOWN",
        status: (x.status || "running") as "running" | "stopped",
        pnl: x.pnl ?? undefined
      }));
      setItems(items);
      setIsMock(result.isMock);
    } else {
      setItems([]);
      setIsMock(true);
    }
  }
  return (
    <div className="rounded-2xl border border-neutral-800 p-4">
      <div className="mb-2 font-medium">Active Strategies</div>
      {isMock && (
        <div className="text-xs text-amber-400 bg-amber-950/30 px-2 py-1 rounded border border-amber-800/50 mb-2">
          ⚠️ Demo Mode
        </div>
      )}
      {items.length === 0 ? (
        <div className="text-center py-4">
          <div className="text-2xl mb-2">⚡</div>
          <div className="text-sm text-neutral-500 mb-2">Henüz çalışan strateji yok</div>
          <a 
            href="/strategy-lab" 
            className="text-xs text-blue-400 hover:text-blue-300 underline"
          >
            İlk stratejinizi oluşturun →
          </a>
        </div>
      ) : (
        <ul className="space-y-2 text-sm">
          {items.map(s => (
            <li key={s.id} className="flex items-center justify-between rounded-xl border border-neutral-800 p-2">
              <span>{asStr(s?.symbol)}</span>
              <span className={asStr(s?.status,"UNKNOWN") === "running" ? "text-green-400" : "text-neutral-500"}>
                {asStr(s?.status,"UNKNOWN").toUpperCase()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

