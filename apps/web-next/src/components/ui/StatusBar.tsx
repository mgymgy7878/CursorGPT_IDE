"use client";
import React from "react";
import { useMarketStore } from "@/stores/marketStore";

type FeedState = "Healthy" | "Degraded" | "Down";
type BrokerState = "Online" | "Offline";

export interface StatusBarProps {
  env?: string;
  feed?: FeedState;
  broker?: BrokerState;
  stalenessSec?: number;
  paused?: boolean;
}

type ChipTone = "neutral" | "success" | "warn" | "danger";
function Chip({ label, value, tone = "neutral" }: { label: string; value: string; tone?: ChipTone }) {
  const toneMap: Record<string, string> = {
    neutral: "bg-neutral-800 text-neutral-200",
    success: "bg-emerald-900/40 text-emerald-300 ring-1 ring-emerald-800",
    warn: "bg-amber-900/40 text-amber-300 ring-1 ring-amber-800",
    danger: "bg-red-900/40 text-red-300 ring-1 ring-red-800",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs ${toneMap[tone]}`}>
      <span className="opacity-70">{label}:</span>
      <strong>{value}</strong>
    </span>
  );
}

export default function StatusBar(props: StatusBarProps) {
  // Varsayılanları store’dan tamamla
  const pausedStore = useMarketStore((s) => s.paused);
  const staleness = props.stalenessSec ?? (() => {
    const ts = useMarketStore.getState().lastMessageTs ?? 0;
    return ts ? Math.max(0, (Date.now() - ts) / 1000) : 0;
  })();

  const feed = props.feed ?? (staleness <= 4 ? "Healthy" : "Degraded");
  const env = props.env ?? "Deneme";
  const broker = props.broker ?? "Offline";
  const paused = props.paused ?? pausedStore;

  const staleTone = staleness <= 1 ? "success" : staleness <= 4 ? "warn" : "danger";
  const feedTone = feed === "Healthy" ? "success" : feed === "Degraded" ? "warn" : "danger";
  const brokerTone = broker === "Online" ? "success" : "warn";

  return (
    <div className="flex items-center flex-wrap gap-2 md:gap-3 text-sm">
      <Chip label="Ortam" value={env} />
      <Chip label="Veri Akışı" value={feed} tone={feedTone as any} />
      <Chip label="Aracı" value={broker} tone={brokerTone as any} />
      <Chip label="Güncellik" value={`${staleness.toFixed(1)}s`} tone={staleTone as any} />
      {paused && <Chip label="Durum" value="PAUSED" tone="warn" />}
    </div>
  );
}


