"use client";
import React from "react";
// SSR çakışmalarını önlemek için dinamik importu efekt içinde yapıyoruz.
type SeriesData = { time: string; value: number };
export default function EquityChart({ data }: { data: SeriesData[] }) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    let dispose: (() => void) | null = null;
    (async () => {
      try {
        const lwc = await import("lightweight-charts");
        if (!containerRef.current) return;
        const chart = lwc.createChart(containerRef.current, {
          height: 240,
          timeScale: { timeVisible: true, secondsVisible: false },
          grid: { vertLines: { visible: false }, horzLines: { visible: false } },
        });
        const series = chart.addAreaSeries({ lineWidth: 2 });
        series.setData(data);
        dispose = () => chart.remove();
      } catch (e) {
        // Sessiz fallback
        // eslint-disable-next-line no-console
        console.warn("EquityChart fallback", e);
      }
    })();
    return () => { if (dispose) dispose(); };
  }, [data]);
  return (
    <div className="w-full rounded-2xl border border-zinc-800 p-3">
      <div className="text-sm mb-2 opacity-80">Equity</div>
      <div ref={containerRef} className="w-full h-[240px] rounded-xl bg-black/10" />
    </div>
  );
} 