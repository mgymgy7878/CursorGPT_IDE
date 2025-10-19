"use client";
import { useEffect, useRef, useState } from "react";
import { createChart, CrosshairMode, ColorType } from "lightweight-charts";
import type { IChartApi } from "lightweight-charts";

type Candle = { t: number; o: number; h: number; l: number; c: number; v: number };
type FibLevel = { ratio: number; price: number };
type BBPoint = { u: number; m: number; l: number };

export default function PriceChartLC({
  candles,
  fibLevels,
  bbSeries,
  symbol,
  timeframe,
  height = 420
}: {
  candles: Candle[];
  fibLevels?: FibLevel[] | null;
  bbSeries?: BBPoint[] | null;
  symbol: string;
  timeframe: string;
  height?: number;
}) {
  const divRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<any>(null);
  const volSeriesRef = useRef<any>(null);
  const lastBarTimeRef = useRef<number | undefined>(undefined);
  
  const [live, setLive] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!divRef.current || !candles || candles.length === 0) return;

    // Destroy previous chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chart = createChart(divRef.current, {
      height,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#e5e7eb"
      },
      grid: {
        horzLines: { color: "#1f2937" },
        vertLines: { color: "#1f2937" }
      },
      crosshair: { mode: CrosshairMode.Normal },
      timeScale: {
        rightOffset: 6,
        borderColor: "#374151",
        timeVisible: true,
        secondsVisible: false
      },
      rightPriceScale: {
        borderColor: "#374151"
      },
    });
    
    chartRef.current = chart as unknown as IChartApi;

    // Candlestick series (cast for compatibility with different typings)
    const anyChart = chart as unknown as any;
    const candleSeries = anyChart.addCandlestickSeries({
      upColor: "#16a34a",
      downColor: "#ef4444",
      borderUpColor: "#16a34a",
      borderDownColor: "#ef4444",
      wickUpColor: "#16a34a",
      wickDownColor: "#ef4444",
    });
    
    candleSeriesRef.current = candleSeries;

    const candleData = candles.map(k => ({
      time: Math.floor(k.t / 1000) as any,
      open: k.o,
      high: k.h,
      low: k.l,
      close: k.c
    }));
    
    candleSeries.setData(candleData);
    lastBarTimeRef.current = candleData[candleData.length - 1]?.time;

    // Volume histogram (secondary scale)
    const volumeSeries = anyChart.addHistogramSeries({
      priceScaleId: "",
      priceFormat: { type: 'volume' as const },
    });
    
    volSeriesRef.current = volumeSeries;
    
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.85, bottom: 0 }
    });
    
    volumeSeries.setData(
      candles.map(k => ({
        time: Math.floor(k.t / 1000) as any,
        value: k.v,
        color: k.c >= k.o ? "#16a34a66" : "#ef444466"
      }))
    );

    // BB overlay (3 lines)
    if (bbSeries && bbSeries.length === candles.length) {
      const upperLine = anyChart.addLineSeries({
        color: "#10b981",
        lineWidth: 1,
        title: "BB Upper"
      });
      
      const middleLine = anyChart.addLineSeries({
        color: "#60a5fa",
        lineWidth: 1,
        lineStyle: 2, // dashed
        title: "BB Middle"
      });
      
      const lowerLine = anyChart.addLineSeries({
        color: "#ef4444",
        lineWidth: 1,
        title: "BB Lower"
      });

      const times = candles.map(k => Math.floor(k.t / 1000) as any);
      
      upperLine.setData(
        times.map((t, i) => ({ time: t, value: bbSeries[i]?.u })).filter(p => !isNaN(p.value))
      );
      
      middleLine.setData(
        times.map((t, i) => ({ time: t, value: bbSeries[i]?.m })).filter(p => !isNaN(p.value))
      );
      
      lowerLine.setData(
        times.map((t, i) => ({ time: t, value: bbSeries[i]?.l })).filter(p => !isNaN(p.value))
      );
    }

    // Fibonacci levels (horizontal price lines)
    if (fibLevels && fibLevels.length) {
      for (const lvl of fibLevels) {
        (candleSeries as any).createPriceLine({
          price: lvl.price,
          color: lvl.ratio === 0.618 ? "#fbbf24" : "#6b7280",
          lineWidth: lvl.ratio === 0.618 ? 2 : 1,
          lineStyle: lvl.ratio === 0.618 ? 0 : 2,
          axisLabelVisible: true,
          title: `${(lvl.ratio * 100).toFixed(1)}%`,
        });
      }
    }

    // ResizeObserver (more efficient than window resize)
    const ro = new ResizeObserver(entries => {
      if (entries[0]) {
        const w = entries[0].contentRect.width;
        chart.applyOptions({ width: Math.max(320, Math.floor(w)) });
      }
    });
    
    ro.observe(divRef.current);

    return () => {
      ro.disconnect();
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [candles, fibLevels, bbSeries, height]);

  // Live feed effect with batch updates (smoother rendering)
  useEffect(() => {
    if (!live) {
      esRef.current?.close();
      esRef.current = null;
      return;
    }
    
    const qs = new URLSearchParams({ symbol, timeframe });
    const es = new EventSource(`/api/marketdata/stream?${qs.toString()}`);
    esRef.current = es;

    let batch: Array<{ bar: any; vol: any }> = [];
    let ticking = false;

    function scheduleFlush() {
      if (ticking) return;
      ticking = true;
      setTimeout(() => {
        for (const item of batch) {
          candleSeriesRef.current?.update(item.bar);
          volSeriesRef.current?.update(item.vol);
        }
        batch = [];
        ticking = false;
      }, 120);
    }

    es.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.event !== "kline") return;
        
        const t = Math.floor(msg.t / 1000);
        const bar = { time: t, open: msg.o, high: msg.h, low: msg.l, close: msg.c };
        const vol = { time: t, value: msg.v, color: msg.c >= msg.o ? "#16a34a66" : "#ef444466" };

        // Batch updates for smoother rendering
        if (lastBarTimeRef.current === t || !lastBarTimeRef.current || t >= (lastBarTimeRef.current as number)) {
          batch.push({ bar, vol });
          scheduleFlush();
          if (msg.final && lastBarTimeRef.current !== t) {
            lastBarTimeRef.current = t;
          }
        }
      } catch {}
    };

    es.onerror = () => {
      es.close();
    };

    return () => {
      es.close();
      batch = [];
      ticking = false;
    };
  }, [live, symbol, timeframe]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setLive(v => !v)}
          className={`px-3 py-1 text-sm rounded-lg border ${
            live ? "border-green-600 text-green-400 bg-green-950/30" : "border-neutral-700"
          } hover:bg-neutral-800 transition`}
          title="Canlı veri akışını aç/kapat (SSE)"
        >
          {live ? "● Live" : "○ Live"}
        </button>
        <span className="opacity-60 text-xs">
          {symbol} • {timeframe}
          {live && <span className="ml-2 text-green-400">⚡ Streaming</span>}
        </span>
      </div>
      <div ref={divRef} className="w-full" />
    </div>
  );
}

