"use client";
import React, { useEffect } from "react";
import { useSystemStore } from "@/stores/useSystemStore";
import { useBtcturkStore } from "@/stores/useBtcturkStore";

function pillText(status: "idle" | "loading" | "live" | "error", mode?: string) {
  if (status === "loading") return "System: bağlanıyor";
  if (status === "error") return "System: hata";
  if (status === "live") return `System: ${mode ?? "LIVE"}`;
  return "System: hazır";
}

export default function SystemHealthPill() {
  const { status, health, start, stop, lastUpdate } = useSystemStore((s) => ({
    status: s.status, health: s.health, start: s.start, stop: s.stop, lastUpdate: s.lastUpdate
  }));

  const { wsStatus, feedMode } = useBtcturkStore(s => ({ 
    wsStatus: s.wsStatus, 
    feedMode: s.feedMode 
  }));

  useEffect(() => { start(); return () => stop(); }, [start, stop]);

  const label = feedMode === "ws" && wsStatus === "OPEN"
    ? "System: ws"
    : health?.mode === "mock"
      ? "System: mock"
      : `System: ${health?.status ?? "unknown"}`;

  return (
    <div className="flex items-center gap-2">
      <span className="px-2 py-1 rounded-full text-xs border border-zinc-200 dark:border-zinc-700">
        {label}
      </span>
      {lastUpdate && (
        <span className="text-xs text-zinc-500">
          {new Date(lastUpdate).toLocaleTimeString("tr-TR")}
        </span>
      )}
    </div>
  );
}
