"use client";

import { useEffect, useState } from "react";
import { fetchWsHealth } from "@/features/health/metrics";

function dot(staleness: number) {
  // <2s green, 2-10s amber, >10s red
  if (staleness < 2) return "bg-green-500";
  if (staleness <= 10) return "bg-amber-500";
  return "bg-red-500";
}

function label(staleness: number) {
  if (staleness < 2) return "OK";
  if (staleness <= 10) return "Slow";
  return "Down";
}

export default function MarketsHealthWidget() {
  const [health, setHealth] = useState<{ source: string; staleness: number }[]>(
    []
  );

  useEffect(() => {
    let alive = true;
    const pull = async () => {
      try {
        const d = await fetchWsHealth();
        if (alive) setHealth(d);
      } catch (err) {
        console.error("WS health fetch error:", err);
      } finally {
        setTimeout(pull, 1500);
      }
    };
    pull();
    return () => {
      alive = false;
    };
  }, []);

  if (health.length === 0) {
    return (
      <div className="text-xs text-neutral-400">No marketdata sources</div>
    );
  }

  return (
    <div className="flex gap-4 items-center">
      {health.map((h) => (
        <div
          key={h.source}
          className="flex items-center gap-2 px-3 py-2 rounded bg-neutral-800/50 border border-neutral-700"
        >
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-block h-2.5 w-2.5 rounded-full ${dot(h.staleness)}`}
              aria-label={`${h.source} ${label(h.staleness)}`}
            />
            <span className="text-sm font-medium">{h.source}</span>
          </div>
          <span className="text-xs text-neutral-400">
            {h.staleness.toFixed(1)}s
          </span>
        </div>
      ))}
    </div>
  );
}
