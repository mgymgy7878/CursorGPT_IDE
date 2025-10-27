"use client";

import {useEffect, useRef, useState} from "react";

type Health = "GREEN" | "YELLOW" | "RED" | "UNKNOWN";

function tone(h: Health) {
  switch (h) {
    case "GREEN":  return "bg-green-500/10 text-green-700 border-green-400/40";
    case "YELLOW": return "bg-yellow-500/10 text-yellow-700 border-yellow-400/40";
    case "RED":    return "bg-red-500/10 text-red-700 border-red-400/40";
    default:       return "bg-zinc-500/10 text-zinc-700 border-zinc-400/40";
  }
}

export default function StatusPill() {
  const [health, setHealth] = useState<Health>("UNKNOWN");
  const [latency, setLatency] = useState<number | null>(null);
  const [ts, setTs] = useState<string>("-");
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  async function poll() {
    const started = performance.now();
    try {
      const res = await fetch("/api/public/health", { cache: "no-store" });
      const ms = Math.round(performance.now() - started);
      setLatency(ms);

      let state: Health = "UNKNOWN";
      if (res.ok) {
        // Esnek şema: {status|state|health}: "GREEN|YELLOW|RED"
        const data = await res.json().catch(() => ({}));
        const raw = (data.status || data.state || data.health || "").toString().toUpperCase();
        if (raw === "GREEN" || raw === "YELLOW" || raw === "RED") state = raw as Health;
        else state = "GREEN"; // 200 ama alan yoksa yeşil varsay
        setTs(data.ts || new Date().toISOString());
      } else {
        state = "RED";
        setTs(new Date().toISOString());
      }
      setHealth(state);
    } catch {
      setHealth("RED");
      setLatency(null);
      setTs(new Date().toISOString());
    }
  }

  useEffect(() => {
    poll();
    timer.current = setInterval(poll, 15000); // 15s
    return () => { if (timer.current) clearInterval(timer.current); };
  }, []);

  return (
    <div className="fixed top-3 right-3 z-50 select-none">
      <span className={`rounded-full border px-3 py-1 text-xs font-medium shadow-sm backdrop-blur ${tone(health)}`}>
        {health} • {latency !== null ? `${latency}ms` : "—"} • {new Date(ts).toLocaleTimeString()}
      </span>
    </div>
  );
}