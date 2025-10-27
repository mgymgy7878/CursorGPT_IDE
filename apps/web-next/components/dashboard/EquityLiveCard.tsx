'use client';
import React from "react";

type Pt = { time: string | number; value: number };
type Props = { equity?: Pt[]; volume?: Pt[] };

export default function EquityLiveCard({ equity = [], volume = [] }: Props) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const chartRef = React.useRef<any>(null);
  const priceSeriesRef = React.useRef<any>(null);
  const volumeSeriesRef = React.useRef<any>(null);
  const activeKindsRef = React.useRef<Set<string>>(new Set(["equity", "volume"]));

  React.useEffect(() => {
    let cleanup: (() => void) | undefined;
    (async () => {
      try {
        const lwc = await import("lightweight-charts");
        if (!containerRef.current) return;
        const chart = lwc.createChart(containerRef.current, { height: 260, timeScale: { timeVisible: true } });
        const price = chart.addAreaSeries({ lineWidth: 2 });
        const vol = chart.addHistogramSeries?.({ priceFormat: { type: "volume" } });
        chartRef.current = chart;
        priceSeriesRef.current = price;
        if (vol) volumeSeriesRef.current = vol;
        cleanup = () => chart.remove();
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn("EquityLiveCard: chart init failed", e);
      }
    })();
    return () => { if (cleanup) cleanup(); };
  }, []);

  React.useEffect(() => {
    const p = priceSeriesRef.current;
    if (p && Array.isArray(equity)) p.setData(equity as any);
    const v = volumeSeriesRef.current;
    if (v && Array.isArray(volume)) v.setData(volume as any);
  }, [equity, volume]);

  return (
    <div className="rounded-2xl border border-zinc-800 p-3">
      <div className="text-sm mb-2 opacity-80">Equity (Live)</div>
      <div ref={containerRef} className="w-full h-[260px] rounded-xl bg-black/10" />
      <div className="mt-2 flex gap-2 text-xs">
        <button
          className="px-2 py-1 rounded border border-zinc-700"
          onClick={() => {
            const set = activeKindsRef.current;
            if (set.has("equity")) { set.delete("equity"); priceSeriesRef.current?.setData([]); }
            else { set.add("equity"); priceSeriesRef.current?.setData(equity as any); }
          }}>
          Toggle Equity
        </button>
        <button
          className="px-2 py-1 rounded border border-zinc-700"
                     onClick={() => {
            const set = activeKindsRef.current;
            if (set.has("volume")) { set.delete("volume"); volumeSeriesRef.current?.setData([]); }
            else { set.add("volume"); volumeSeriesRef.current?.setData(volume as any); }
          }}>
          Toggle Volume
        </button>
      </div>
    </div>
  );
}