/**
 * MarketChartWorkspace - Figma Parity Full View Chart
 *
 * TradingView-vari chart workspace:
 * - Top bar: Symbol pill + timeframe + Mode + OHLC + Vol
 * - Timeframe row: 1m 5m 15m 1H 4H 1D 1W 1M
 * - Right tool group: Pro / Araçlar / Replay / +/- / Çıkış
 * - Chart area: candles + volume histogram (lightweight-charts)
 */

"use client";

import { useEffect, useRef, useState, useMemo } from "react";
// SSOT: createChart import sadece type'lar için (CrosshairMode, ColorType, Series types)
// Chart oluşturma createSparkChart helper'ı üzerinden yapılmalı (attributionLogo zorunlu false)
import {
  CrosshairMode,
  ColorType,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
} from "lightweight-charts";
import type { IChartApi, ISeriesApi } from "lightweight-charts";
import { cn } from "@/lib/utils";
import { formatCurrency, formatNumber } from "@/lib/format";
import { createSparkChart } from "@/lib/charts/createSparkChart";
// MVL: Live market data hook + staleness badge
import { useCandleSeries } from "@/hooks/useCandleSeries";
import RightRailMarketPanels from "@/components/market/RightRailMarketPanels";
import { isMockMode } from "@/lib/marketClient";
import { useMarketDataHealth, getWsState } from "@/hooks/useMarketDataHealth";
import { useMarketTicker } from "@/hooks/useMarketTicker"; // P5.2: Lag metriği için

export interface MarketChartWorkspaceProps {
  symbol: string;
  timeframe?: string;
  onTimeframeChange?: (tf: string) => void;
  onClose?: () => void;
  isFullscreen?: boolean;
  executorReachable?: boolean; // Executor OFFLINE iken TP/Entry/SL "—" göster
}

// Generate realistic mock OHLC data (random walk, not sine)
function generateMockCandles(symbol: string, count: number = 200) {
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = (hash << 5) - hash + symbol.charCodeAt(i);
    hash = hash & hash;
  }

  const candles: Array<{
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }> = [];
  let price = 42000 + (Math.abs(hash) % 10000);
  const baseVolume = 1000000;

  for (let i = 0; i < count; i++) {
    const change = (Math.random() - 0.5) * 200 + Math.sin(i / 20) * 50;
    const open = price;
    const close = open + change;
    const high = Math.max(open, close) + Math.random() * 100;
    const low = Math.min(open, close) - Math.random() * 100;
    const volume = baseVolume + Math.random() * baseVolume * 0.5;

    candles.push({
      time: Math.floor(Date.now() / 1000) - (count - i) * 3600, // hourly
      open,
      high,
      low,
      close,
      volume,
    });

    price = close;
  }

  return candles;
}

export default function MarketChartWorkspace({
  symbol,
  timeframe = "1D",
  onTimeframeChange,
  onClose,
  isFullscreen = false,
  executorReachable = true,
}: MarketChartWorkspaceProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const rsiChartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const rsiChartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const rsiSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const rsiResizeObserverRef = useRef<ResizeObserver | null>(null);
  // PATCH: PriceLine registry for dedupe and cleanup
  const priceLinesRef = useRef<Map<string, any>>(new Map());

  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe);
  const [ohlc, setOhlc] = useState({ o: 0, h: 0, l: 0, c: 0, v: 0 });
  const [currentRsi, setCurrentRsi] = useState<number | null>(null);
  const [feedAsOfMs, setFeedAsOfMs] = useState<number | null>(null);
  const [chartInitError, setChartInitError] = useState<string | null>(null);

  const timeframes = ["1m", "5m", "15m", "1H", "4H", "1D", "1W", "1M"];

  // Real market data (no mock fallback)
  const binanceSymbol = symbol.replace("/", ""); // BTC/USDT -> BTCUSDT
  const {
    candles: realCandles,
    loading: candlesLoading,
    feedAsOfMs: hookFeedAsOfMs,
  } = useCandleSeries(binanceSymbol, selectedTimeframe.toLowerCase(), 500);

  // P5.2: Lag metriği için ticker verisi
  const { ticker } = useMarketTicker(binanceSymbol);
  // P7.2: Lag metriği - ingest_ms - lastTradeTime_ms (avgPrice closeTime)
  const lagMs =
    ticker?.lastTradeTime && ticker?.asOfMs
      ? ticker.asOfMs - ticker.lastTradeTime
      : null;
  const lagText = lagMs !== null ? `${lagMs}ms` : null;

  // Update feedAsOfMs state when hook updates
  useEffect(() => {
    if (hookFeedAsOfMs) {
      setFeedAsOfMs(hookFeedAsOfMs);
    }
  }, [hookFeedAsOfMs]);

  // P2.2: WS state tracking
  const { health: marketDataHealth } = useMarketDataHealth();
  // P7.4: Candles durumu
  const candlesOk =
    marketDataHealth.status === "healthy" ||
    marketDataHealth.status === "lagging";

  // P7.1: WS state mapping'i tek helper'dan kullan (güvenli wrapper)
  let wsStateInfo;
  try {
    wsStateInfo = getWsState(marketDataHealth);
  } catch (e) {
    console.error("[MarketChartWorkspace] getWsState error:", e);
    // Fallback: basit mapping
    wsStateInfo = {
      state: marketDataHealth.wsConnected
        ? "CONNECTED"
        : ("DISCONNECTED" as const),
      label: marketDataHealth.wsConnected ? "CONNECTED" : "DISCONNECTED",
      color: marketDataHealth.wsConnected ? "success" : ("danger" as const),
    };
  }

  // Convert to chart format (time already in seconds from useCandleSeries)
  // Sort by time ascending (Lightweight Charts requirement)
  const candlesForChart = useMemo(() => {
    if (realCandles.length === 0) return [];
    return realCandles
      .map((c) => ({
        time: c.time as any,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.volume,
      }))
      .sort((a, b) => (a.time as number) - (b.time as number)); // Ensure ascending
  }, [realCandles]);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    setChartInitError(null);

    let ro: ResizeObserver | null = null;

    const cleanup = () => {
      if (rsiResizeObserverRef.current) {
        rsiResizeObserverRef.current.disconnect();
        rsiResizeObserverRef.current = null;
      }
      if (rsiChartRef.current) {
        rsiChartRef.current.remove();
        rsiChartRef.current = null;
      }
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
      rsiSeriesRef.current = null;
    };

    try {
      // Destroy previous chart
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }

      // PATCH: createSparkChart helper kullan (attributionLogo zorunlu false)
      const chart = createSparkChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight || 400,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#e5e7eb",
      },
      grid: {
        horzLines: { color: "#1f2937" },
        vertLines: { color: "#1f2937" },
      },
      crosshair: { mode: CrosshairMode.Normal },
      timeScale: {
        rightOffset: 6,
        borderColor: "#374151",
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: "#374151",
        // PATCH: Chart alanını genişletmek için scale offset (TP/Entry ladder için alan)
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
    });

    // Not: TradingView attribution yok - createSparkChart helper'ında attributionLogo: false set edilmiş

    chartRef.current = chart;

    // P0: Locale tutarlılığı — Y ekseni ve crosshair TR format (formatNumber tr-TR)
    chart.applyOptions({
      localization: {
        priceFormatter: (price: number) =>
          formatNumber(price, { locale: "tr-TR", maximumFractionDigits: 2 }),
      },
    });

    // Candlestick series (v5 API)
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#16a34a",
      downColor: "#ef4444",
      borderUpColor: "#16a34a",
      borderDownColor: "#ef4444",
      wickUpColor: "#16a34a",
      wickDownColor: "#ef4444",
    });
    candleSeriesRef.current = candleSeries as ISeriesApi<"Candlestick">;

    // Volume histogram (v5 API)
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "",
      lastValueVisible: false,
      priceLineVisible: false,
    });
    volumeSeriesRef.current = volumeSeries as ISeriesApi<"Histogram">;

    // Volume scale options
    chart.priceScale("").applyOptions({
      scaleMargins: { top: 0.82, bottom: 0 },
    });

    // Fit content to view
    chart.timeScale().fitContent();

    // Initial data will be set via separate effect below

    // RSI Chart (PATCH E - alt panel)
    if (rsiChartContainerRef.current) {
      // PATCH: createSparkChart helper kullan (attributionLogo zorunlu false)
      const rsiChart = createSparkChart(rsiChartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: 180,
        layout: {
          background: { type: ColorType.Solid, color: "transparent" },
          textColor: "#e5e7eb",
        },
        grid: {
          horzLines: { color: "#1f2937" },
          vertLines: { color: "#1f2937" },
        },
        crosshair: { mode: CrosshairMode.Normal },
        timeScale: {
          rightOffset: 6,
          borderColor: "#374151",
          timeVisible: true,
          secondsVisible: false,
        },
        rightPriceScale: {
          borderColor: "#374151",
          scaleMargins: { top: 0.1, bottom: 0.1 },
        },
      });

      // Not: TradingView attribution yok - createSparkChart helper'ında attributionLogo: false set edilmiş

      rsiChartRef.current = rsiChart;

      // RSI Line series
      const rsiSeries = rsiChart.addSeries(LineSeries, {
        color: "#a855f7",
        lineWidth: 2,
        priceFormat: {
          type: "price",
          precision: 1,
          minMove: 0.1,
        },
      });
      rsiSeriesRef.current = rsiSeries as ISeriesApi<"Line">;

      // Note: RSI data will be set in a separate useEffect that has access to candlesForChart
      // For now, initialize with empty data to avoid crashes
      rsiSeries.setData([]);

      // RSI reference lines (30/70)
      (rsiSeries as any).createPriceLine({
        price: 70,
        color: "#ef4444",
        lineWidth: 1,
        lineStyle: 2, // dashed
        axisLabelVisible: true,
        title: "70",
      });

      (rsiSeries as any).createPriceLine({
        price: 30,
        color: "#4ade80",
        lineWidth: 1,
        lineStyle: 2, // dashed
        axisLabelVisible: true,
        title: "30",
      });

      // Sync time scale with main chart
      // Guard against null range values ({from:null, to:null}) that can crash setVisibleRange
      const onVisibleRange = (timeRange: any) => {
        // timeRange bazen { from: null, to: null } geliyor → truthy ama invalid
        if (!timeRange) return;
        if (timeRange.from == null || timeRange.to == null) return;
        const rsiChart = rsiChartRef.current;
        if (!rsiChart) return;

        try {
          rsiChart.timeScale().setVisibleRange(timeRange);
        } catch {
          // no-op: chart senkronu kritik değil, UI crash etmemeli
        }
      };

      chart.timeScale().subscribeVisibleTimeRangeChange(onVisibleRange);

      // ResizeObserver for RSI chart
      const rsiRo = new ResizeObserver((entries) => {
        if (entries[0] && rsiChartRef.current) {
          const w = entries[0].contentRect.width;
          if (w > 0) {
            rsiChartRef.current.applyOptions({
              width: Math.max(320, Math.floor(w)),
            });
          }
        }
      });

      rsiResizeObserverRef.current = rsiRo;
      rsiRo.observe(rsiChartContainerRef.current);
    }

    // ResizeObserver for main chart
    ro = new ResizeObserver((entries) => {
      if (entries[0] && chartRef.current) {
        const w = entries[0].contentRect.width;
        const h = entries[0].contentRect.height;
        if (w > 0 && h > 0) {
          chartRef.current.applyOptions({
            width: Math.max(320, Math.floor(w)),
            height: Math.max(200, Math.floor(h)),
          });
        }
      }
    });

    ro.observe(chartContainerRef.current);
    } catch (e) {
      console.error("[MarketChartWorkspace] CHART_INIT_FAIL", e);

      const msg =
        e instanceof Error
          ? e.message
          : typeof e === "string"
            ? e
            : (() => {
                try {
                  return JSON.stringify(e);
                } catch {
                  return String(e);
                }
              })();

      const short = msg.trim().slice(0, 60);
      setChartInitError(short ? `CHART_INIT_FAIL: ${short}` : "CHART_INIT_FAIL");
      cleanup();
      return () => {};
    }

    // Cleanup (StrictMode-safe: double-mount koruması)
    return () => {
      ro?.disconnect();
      if (rsiResizeObserverRef.current) {
        rsiResizeObserverRef.current.disconnect();
        rsiResizeObserverRef.current = null;
      }

      // Not: TradingView attribution CSS ile gizleniyor, MutationObserver gerekmiyor

      // Remove charts (subscriptions otomatik temizlenir, price lines otomatik temizlenir)
      // Note: chart.remove() automatically unsubscribes all event listeners including onVisibleRange

      // PATCH: Cleanup priceLines before removing chart (with runtime guard)
      if (candleSeriesRef.current) {
        const series = candleSeriesRef.current as any;
        // Runtime guard: Check if removePriceLine API exists
        if (typeof series.removePriceLine === "function") {
          priceLinesRef.current.forEach((handle) => {
            if (handle) {
              try {
                series.removePriceLine(handle);
              } catch {
                // Ignore cleanup errors (chart.remove() will handle remaining cleanup)
              }
            }
          });
        }
        // Note: If removePriceLine doesn't exist, chart.remove() will clean up all priceLines
        priceLinesRef.current.clear();
      }

      if (rsiChartRef.current) {
        rsiChartRef.current.remove();
        rsiChartRef.current = null;
      }
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }

      // Clear refs
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
      rsiSeriesRef.current = null;
    };
  }, [symbol, selectedTimeframe]);

  // MVL: Update chart data when live candles change (memoized candlesForChart prevents infinite loops)
  useEffect(() => {
    if (
      !candleSeriesRef.current ||
      !volumeSeriesRef.current ||
      candlesForChart.length === 0
    ) {
      // If RSI chart exists but no candle data, clear RSI
      if (rsiSeriesRef.current) {
        rsiSeriesRef.current.setData([]);
        setCurrentRsi(null);
      }
      return;
    }

    const lastCandle = candlesForChart[candlesForChart.length - 1];

    setOhlc({
      o: lastCandle.open,
      h: lastCandle.high,
      l: lastCandle.low,
      c: lastCandle.close,
      v: lastCandle.volume,
    });

    // setData: tamamen replace eder, zaman sıralı olmalı (zaten sort edildi)
    candleSeriesRef.current.setData(
      candlesForChart.map((c) => ({
        time: c.time as any,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }))
    );

    // fitContent: ilk görünürlüğü garanti et
    if (chartRef.current) {
      try {
        chartRef.current.timeScale().fitContent();
      } catch (e) {
        console.warn("[MarketChartWorkspace] fitContent failed:", e);
      }
    }

    volumeSeriesRef.current.setData(
      candlesForChart.map((c) => ({
        time: c.time as any,
        value: c.volume,
        color: c.close >= c.open ? "#16a34a66" : "#ef444466",
      }))
    );

    // Generate and update RSI data (mock - 0-100 range)
    if (rsiSeriesRef.current && candlesForChart.length > 0) {
      const rsiData = candlesForChart.map((c, i) => {
        // Simple RSI mock: oscillate between 30-70 with some randomness
        const baseRsi = 50 + Math.sin(i / 10) * 20 + (Math.random() - 0.5) * 10;
        return {
          time: c.time as any,
          value: Math.max(20, Math.min(80, baseRsi)),
        };
      });

      rsiSeriesRef.current.setData(rsiData);

      // Set current RSI value (last data point)
      if (rsiData.length > 0) {
        setCurrentRsi(rsiData[rsiData.length - 1].value);
      }
    }

    // PATCH: Entry/TP/SL price lines with dedupe and cleanup
    // Executor OFFLINE ise price lines gösterme
    if (executorReachable) {
      const currentPrice = lastCandle.close;
      const entryPrice = Number((currentPrice * 0.995).toFixed(2)); // Entry %0.5 below
      const tpPrice = Number((currentPrice * 1.03).toFixed(2)); // TP %3 above
      const slPrice = Number((currentPrice * 0.97).toFixed(2)); // SL %3 below

      // Normalize: unique levels by kind
      const desiredLevels = new Map<
        string,
        { kind: string; price: number; color: string; title: string }
      >();
      desiredLevels.set(`ENTRY:${entryPrice}`, {
        kind: "ENTRY",
        price: entryPrice,
        color: "#60a5fa",
        title: "EN",
      });
      desiredLevels.set(`TP:${tpPrice}`, {
        kind: "TP",
        price: tpPrice,
        color: "#4ade80",
        title: "TP",
      });
      desiredLevels.set(`SL:${slPrice}`, {
        kind: "SL",
        price: slPrice,
        color: "#f87171",
        title: "SL",
      });

      if (!candleSeriesRef.current) return;

      const series = candleSeriesRef.current as any;
      const existingKeys = new Set(priceLinesRef.current.keys());

      // PATCH: Remove priceLines that are no longer needed (with runtime guard)
      existingKeys.forEach((key) => {
        if (!desiredLevels.has(key)) {
          const handle = priceLinesRef.current.get(key);
          // Runtime guard: Check if removePriceLine API exists (lightweight-charts version compatibility)
          if (handle && typeof (series as any).removePriceLine === "function") {
            try {
              (series as any).removePriceLine(handle);
            } catch {
              // Ignore remove errors (chart may handle cleanup on remove)
            }
          }
          priceLinesRef.current.delete(key);
        }
      });

      // Create or skip priceLines for desired levels
      desiredLevels.forEach((level, key) => {
        if (!priceLinesRef.current.has(key)) {
          try {
            const handle = series.createPriceLine({
              price: level.price,
              color: level.color,
              lineWidth: 1, // PATCH: Thinner line since sidebar is primary display
              lineStyle: 0, // solid
              axisLabelVisible: false, // PATCH: Hide label (sidebar shows full info, chart shows line only)
              title: "", // Empty title since axisLabelVisible is false
            });
            if (handle) {
              priceLinesRef.current.set(key, handle);
            }
          } catch {
            // Ignore create errors
          }
        }
        // If key exists, skip (no re-create)
      });
    } else {
      // Executor OFFLINE: Tüm price lines'ı temizle
      if (candleSeriesRef.current) {
        const series = candleSeriesRef.current as any;
        priceLinesRef.current.forEach((handle) => {
          if (typeof (series as any).removePriceLine === "function") {
            try {
              (series as any).removePriceLine(handle);
            } catch {}
          }
        });
        priceLinesRef.current.clear();
      }
    }
  }, [candlesForChart, executorReachable]);

  const handleTimeframeClick = (tf: string) => {
    setSelectedTimeframe(tf);
    onTimeframeChange?.(tf);
  };

  return (
    <div className="h-full flex flex-col bg-neutral-950 overflow-hidden">
      {/* PATCH: Top Bar - Fullscreen modunda minimal bar (Figma gibi) */}
      {isFullscreen ? (
        <div
          className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-neutral-900/30"
          style={{ gap: "var(--header-gap, 8px)" }}
        >
          <div
            className="flex items-center gap-3"
            style={{ gap: "var(--header-gap, 8px)" }}
          >
            {/* Symbol pill */}
            <span className="px-3 py-1 rounded-full text-[12px] font-semibold bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
              {symbol}
            </span>
            {/* Feed health indicator */}
            {candlesLoading ? (
              <span className="px-2 py-1 rounded text-[10px] font-medium bg-neutral-500/20 border border-neutral-500/30 text-neutral-400">
                Loading...
              </span>
            ) : realCandles.length > 0 ? (
              <span className="px-2 py-1 rounded text-[10px] font-medium bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
                Live
              </span>
            ) : (
              <span className="px-2 py-1 rounded text-[10px] font-medium bg-red-500/20 border border-red-500/30 text-red-400">
                Offline
              </span>
            )}
            {/* Timeframe chips */}
            {timeframes.map((tf) => (
              <button
                key={tf}
                onClick={() => handleTimeframeClick(tf)}
                className={cn(
                  "px-2.5 py-1 text-[11px] font-medium rounded transition-colors",
                  selectedTimeframe === tf
                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                    : "text-neutral-400 hover:text-neutral-200 hover:bg-white/5"
                )}
              >
                {tf}
              </button>
            ))}
          </div>

          <div
            className="flex items-center gap-1.5"
            style={{ gap: "calc(var(--header-gap, 8px) * 0.75)" }}
          >
            <button className="px-2 py-1 text-[11px] font-medium rounded text-neutral-400 hover:text-neutral-200 hover:bg-white/5">
              Pro
            </button>
            <button className="px-2 py-1 text-[11px] font-medium rounded text-neutral-400 hover:text-neutral-200 hover:bg-white/5">
              Araçlar
            </button>
            <button className="px-2 py-1 text-[11px] font-medium rounded text-neutral-400 hover:text-neutral-200 hover:bg-white/5">
              Replay
            </button>
            <button
              type="button"
              className="min-w-[24px] min-h-[24px] inline-flex items-center justify-center px-2 py-1 text-[11px] font-medium rounded text-neutral-400 hover:text-neutral-200 hover:bg-white/5"
              aria-label="Grafik yakınlaştır"
              title="Yakınlaştır (sürükleme alternatifi)"
            >
              +
            </button>
            <button
              type="button"
              className="min-w-[24px] min-h-[24px] inline-flex items-center justify-center px-2 py-1 text-[11px] font-medium rounded text-neutral-400 hover:text-neutral-200 hover:bg-white/5"
              aria-label="Grafik uzaklaştır"
              title="Uzaklaştır (sürükleme alternatifi)"
            >
              -
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="px-2 py-1 text-[11px] font-medium rounded text-neutral-400 hover:text-neutral-200 hover:bg-white/5"
              >
                Çıkış
              </button>
            )}
          </div>
        </div>
      ) : (
        <div
          className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-neutral-900/30"
          style={{ gap: "var(--header-gap, 8px)" }}
        >
          <div
            className="flex items-center gap-3"
            style={{ gap: "var(--header-gap, 8px)" }}
          >
            {/* Back button - küçük ikon + kısa metin */}
            {onClose && (
              <button
                onClick={onClose}
                className="flex items-center gap-1 px-2 py-1 text-[11px] text-neutral-400 hover:text-neutral-200 transition-colors rounded hover:bg-white/5"
                title="Tabloya Dön"
              >
                <span>←</span>
                <span className="hidden sm:inline">Tabloya Dön</span>
              </button>
            )}
            {/* Symbol pill */}
            <span className="px-3 py-1 rounded-full text-[12px] font-semibold bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
              {symbol}
            </span>
            {/* Feed health indicator */}
            {candlesLoading ? (
              <span className="px-2 py-1 rounded text-[10px] font-medium bg-neutral-500/20 border border-neutral-500/30 text-neutral-400">
                Loading...
              </span>
            ) : realCandles.length > 0 ? (
              <span className="px-2 py-1 rounded text-[10px] font-medium bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
                Live
              </span>
            ) : (
              <span className="px-2 py-1 rounded text-[10px] font-medium bg-red-500/20 border border-red-500/30 text-red-400">
                Offline
              </span>
            )}
            <span className="text-[11px] text-neutral-500">
              1D · Trend Follower v1
            </span>
          </div>

          <div
            className="flex items-center gap-4"
            style={{ gap: "var(--header-gap, 8px)" }}
          >
            {/* OHLC + Vol */}
            <div
              className="flex items-center gap-3 text-[11px] font-mono tabular-nums"
              style={{ gap: "var(--header-gap, 8px)" }}
            >
              <div>
                <span className="text-neutral-500">O:</span>{" "}
                <span className="text-neutral-300">
                  {formatCurrency(ohlc.o, "tr-TR", "USD")}
                </span>
              </div>
              <div>
                <span className="text-neutral-500">H:</span>{" "}
                <span className="text-neutral-300">
                  {formatCurrency(ohlc.h, "tr-TR", "USD")}
                </span>
              </div>
              <div>
                <span className="text-neutral-500">L:</span>{" "}
                <span className="text-neutral-300">
                  {formatCurrency(ohlc.l, "tr-TR", "USD")}
                </span>
              </div>
              <div>
                <span className="text-neutral-500">C:</span>{" "}
                <span className="text-neutral-300">
                  {formatCurrency(ohlc.c, "tr-TR", "USD")}
                </span>
              </div>
              <div>
                <span className="text-neutral-500">Vol:</span>{" "}
                <span className="text-neutral-300">
                  {formatNumber(ohlc.v / 1000, { locale: "tr-TR" })}K
                </span>
              </div>
            </div>

            {/* Mode badge - Live/Mock indicator (only if explicit mock) */}
            {isMockMode() ? (
              <span className="text-[10px] px-2 py-1 rounded border text-amber-400 bg-amber-500/20 border-amber-500/30">
                Mock Data
              </span>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2 py-1 rounded border text-emerald-400 bg-emerald-500/20 border-emerald-500/30">
                  Live (Binance)
                </span>
                {/* Veri kaynağı/barTime/feedAsOf/TZ bilgisi */}
                {realCandles.length > 0 &&
                  (() => {
                    const lastCandle = realCandles[realCandles.length - 1];
                    const barTimeMs = lastCandle.time * 1000; // Unix seconds -> ms
                    const barTimeDate = new Date(barTimeMs);
                    const barTimeStr = barTimeDate.toUTCString().split(" ")[4]; // HH:mm:ss UTC

                    // Periyot-aware bar label
                    const timeframeLabels: Record<string, string> = {
                      "1m": "Minute candle",
                      "5m": "5-minute candle",
                      "15m": "15-minute candle",
                      "1h": "Hourly candle",
                      "4h": "4-hour candle",
                      "1d": "Daily candle",
                      "1w": "Weekly candle",
                      "1M": "Monthly candle",
                    };
                    const timeframeLabel =
                      timeframeLabels[selectedTimeframe.toLowerCase()] ||
                      "Candle";

                    // Feed asOf (Local timezone)
                    const feedAsOfStr = feedAsOfMs
                      ? new Date(feedAsOfMs).toLocaleTimeString("tr-TR", {
                          hour12: false,
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })
                      : null;

                    // P7.1: WS state mapping'i tek helper'dan kullan (yukarıda try-catch ile alındı)
                    const wsStateLabel =
                      wsStateInfo.state === "CONNECTED"
                        ? "connected"
                        : wsStateInfo.state === "BACKOFF"
                          ? "backoff"
                          : "disconnected";

                    // P7.1: WS backoff drilldown tooltip (nextRetryIn varsa göster)
                    const wsTooltip =
                      wsStateInfo.state === "BACKOFF"
                        ? `WS backoff: Son bağlantı kesildi. Yeniden deneme devam ediyor. Reconnects: ${marketDataHealth.reconnects}`
                        : wsStateInfo.state === "CONNECTED"
                          ? `WS connected: Bağlantı aktif. Reconnects: ${marketDataHealth.reconnects}`
                          : `WS disconnected: Bağlantı kesildi. Reconnects: ${marketDataHealth.reconnects}`;

                    return (
                      <div className="flex flex-col gap-0.5">
                        {/* Time basis tek satır (UTC tekleştirme) */}
                        <span className="text-[8px] text-neutral-600 font-mono">
                          Time basis: UTC
                        </span>
                        <span className="text-[9px] text-neutral-500 font-mono">
                          Bar start: {barTimeStr} ({timeframeLabel})
                        </span>
                        {feedAsOfStr && (
                          <span className="text-[9px] text-neutral-500 font-mono">
                            Ingest time (Local): {feedAsOfStr}
                          </span>
                        )}
                        {/* P7.2: Lag metriği - ingest(local) - exchange(lastTradeTime) */}
                        {lagText && (
                          <span
                            className="text-[9px] text-neutral-500 font-mono"
                            title="Lag = ingest(local) - exchange(lastTradeTime)"
                          >
                            Lag: {lagText}
                          </span>
                        )}
                        {/* P7.1: WS state satırı (tooltip ile) - helper'dan gelen label'ı kullan */}
                        <span
                          className="text-[9px] text-neutral-500 font-mono cursor-help"
                          title={wsTooltip}
                        >
                          WS state: {wsStateLabel}
                        </span>
                        {/* P7.4: Candles STALE - age negatif guard (now - close/open ters dönmesin) */}
                        {!candlesOk &&
                          lastCandle &&
                          (() => {
                            const openTimeMs = lastCandle.time * 1000; // Unix seconds -> ms
                            const closeTimeMs = lastCandle.closeTime
                              ? lastCandle.closeTime * 1000
                              : null;
                            const nowMs = Date.now();
                            const ageMs = closeTimeMs
                              ? nowMs - closeTimeMs
                              : nowMs - openTimeMs;
                            const ageSec = Math.max(
                              0,
                              Math.floor(ageMs / 1000)
                            );
                            const openTimeStr = new Date(openTimeMs)
                              .toUTCString()
                              .split(" ")[4]; // HH:mm:ss
                            const closeTimeStr = closeTimeMs
                              ? new Date(closeTimeMs)
                                  .toUTCString()
                                  .split(" ")[4]
                              : null;
                            return (
                              <div className="text-[8px] text-amber-400/80 font-mono space-y-0.5">
                                <div>Candles: STALE (age: {ageSec}s)</div>
                                {closeTimeStr && (
                                  <div className="text-[7px] text-neutral-600">
                                    Last kline: open {openTimeStr}, close{" "}
                                    {closeTimeStr}
                                  </div>
                                )}
                                <div className="text-[7px] text-neutral-600 italic">
                                  Klines are uniquely identified by open time
                                </div>
                              </div>
                            );
                          })()}
                      </div>
                    );
                  })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* PATCH U: Timeframe Row - Figma parity spacing (sadece workspace modunda) */}
      {!isFullscreen && (
        <div
          className="flex items-center gap-1 px-4 py-2 border-b border-white/10 bg-neutral-900/20"
          style={{ gap: "calc(var(--header-gap, 8px) * 0.5)" }}
        >
          {timeframes.map((tf) => (
            <button
              key={tf}
              onClick={() => handleTimeframeClick(tf)}
              className={cn(
                "px-2.5 py-1 text-[11px] font-medium rounded transition-colors",
                selectedTimeframe === tf
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  : "text-neutral-400 hover:text-neutral-200 hover:bg-white/5"
              )}
            >
              {tf}
            </button>
          ))}
          <div className="flex-1" />
          {/* PATCH U: Right tool group - Figma parity spacing */}
          <div
            className="flex items-center gap-1.5"
            style={{ gap: "calc(var(--header-gap, 8px) * 0.75)" }}
          >
            <button className="px-2 py-1 text-[11px] font-medium rounded text-neutral-400 hover:text-neutral-200 hover:bg-white/5">
              Pro
            </button>
            <button className="px-2 py-1 text-[11px] font-medium rounded text-neutral-400 hover:text-neutral-200 hover:bg-white/5">
              Araçlar
            </button>
            <button className="px-2 py-1 text-[11px] font-medium rounded text-neutral-400 hover:text-neutral-200 hover:bg-white/5">
              Replay
            </button>
            <button
              type="button"
              className="min-w-[24px] min-h-[24px] inline-flex items-center justify-center px-2 py-1 text-[11px] font-medium rounded text-neutral-400 hover:text-neutral-200 hover:bg-white/5"
              aria-label="Grafik yakınlaştır"
              title="Yakınlaştır (sürükleme alternatifi)"
            >
              +
            </button>
            <button
              type="button"
              className="min-w-[24px] min-h-[24px] inline-flex items-center justify-center px-2 py-1 text-[11px] font-medium rounded text-neutral-400 hover:text-neutral-200 hover:bg-white/5"
              aria-label="Grafik uzaklaştır"
              title="Uzaklaştır (sürükleme alternatifi)"
            >
              -
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="px-2 py-1 text-[11px] font-medium rounded text-neutral-400 hover:text-neutral-200 hover:bg-white/5"
              >
                Çıkış
              </button>
            )}
          </div>
        </div>
      )}

      {/* Chart Area - Main (Candles + Volume) - flex-1 min-h-0 ile dikey alan yönetimi */}
      {/* PATCH: Chart container overflow kontrolü + sağda RightRailMarketPanels için flex layout */}
      <div
        className="flex-1 min-h-0 relative overflow-hidden flex"
        style={{ minHeight: "300px" }}
      >
        <div ref={chartContainerRef} className="flex-1 min-w-0 h-full" />
        {chartInitError && (
          <div
            className="absolute inset-0 grid place-items-center bg-gray-900/90 text-gray-300"
            role="alert"
          >
            <div className="text-sm opacity-90">
              Grafik başlatılamadı ({chartInitError})
              <div className="mt-1 text-xs opacity-60">Detay: Console</div>
            </div>
          </div>
        )}
        {/* PATCH: Compact TP/Entry ladder sidebar (max 140px, scrollable if needed) */}
        {/* PATCH: Compact TP/Entry ladder sidebar (max 140px, scrollable if needed) */}
        {/* PATCH: Unique levels only (dedupe by price) */}
        {(() => {
          // Executor OFFLINE ise "—" göster
          const uniqueLevels = executorReachable
            ? (() => {
                const currentPrice = ohlc.c || 0;
                const entryPrice = Number((currentPrice * 0.995).toFixed(2));
                const tpPrice = Number((currentPrice * 1.03).toFixed(2));
                const slPrice = Number((currentPrice * 0.97).toFixed(2));

                return [
                  { kind: "TP", price: tpPrice, color: "emerald", count: 1 },
                  { kind: "Entry", price: entryPrice, color: "blue", count: 1 },
                  { kind: "SL", price: slPrice, color: "red", count: 1 },
                ].filter((level) => level.price > 0);
              })()
            : [
                { kind: "TP", price: null, color: "neutral", count: 0 },
                { kind: "Entry", price: null, color: "neutral", count: 0 },
                { kind: "SL", price: null, color: "neutral", count: 0 },
              ];

          return (
            <div className="flex-shrink-0 w-[140px] border-l border-white/10 bg-neutral-900/40 overflow-y-auto overflow-x-hidden">
              <div className="p-1.5 space-y-0.5">
                {/* TP Orders */}
                <div className="text-[9px] text-neutral-500 mb-1 px-1 font-medium">
                  TP
                </div>
                {uniqueLevels.filter((l) => l.kind === "TP").length > 0 &&
                uniqueLevels.find((l) => l.kind === "TP")?.price != null ? (
                  uniqueLevels
                    .filter((l) => l.kind === "TP")
                    .map((level, i) => (
                      <div
                        key={`tp-${i}`}
                        className="px-1.5 py-0.5 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 rounded leading-tight"
                      >
                        {level.price?.toFixed(2)}
                      </div>
                    ))
                ) : (
                  <div
                    className="px-1.5 py-0.5 text-[10px] font-mono text-neutral-500 bg-neutral-800/50 rounded leading-tight"
                    title="Executor kapalı"
                  >
                    —
                  </div>
                )}
                {/* Entry Orders */}
                <div className="text-[9px] text-neutral-500 mb-1 mt-2 px-1 font-medium">
                  Entry
                </div>
                {uniqueLevels.filter((l) => l.kind === "Entry").length > 0 &&
                uniqueLevels.find((l) => l.kind === "Entry")?.price != null ? (
                  uniqueLevels
                    .filter((l) => l.kind === "Entry")
                    .map((level, i) => (
                      <div
                        key={`entry-${i}`}
                        className="px-1.5 py-0.5 text-[10px] font-mono text-blue-400 bg-blue-500/10 rounded leading-tight"
                      >
                        {level.price?.toFixed(2)}
                      </div>
                    ))
                ) : (
                  <div
                    className="px-1.5 py-0.5 text-[10px] font-mono text-neutral-500 bg-neutral-800/50 rounded leading-tight"
                    title="Executor kapalı"
                  >
                    —
                  </div>
                )}
                {/* SL Orders */}
                <div className="text-[9px] text-neutral-500 mb-1 mt-2 px-1 font-medium">
                  SL
                </div>
                {uniqueLevels.filter((l) => l.kind === "SL").length > 0 &&
                uniqueLevels.find((l) => l.kind === "SL")?.price != null ? (
                  uniqueLevels
                    .filter((l) => l.kind === "SL")
                    .map((level, i) => (
                      <div
                        key={`sl-${i}`}
                        className="px-1.5 py-0.5 text-[10px] font-mono text-red-400 bg-red-500/10 rounded leading-tight"
                      >
                        {level.price?.toFixed(2)}
                      </div>
                    ))
                ) : (
                  <div
                    className="px-1.5 py-0.5 text-[10px] font-mono text-neutral-500 bg-neutral-800/50 rounded leading-tight"
                    title="Executor kapalı"
                  >
                    —
                  </div>
                )}
              </div>
            </div>
          );
        })()}
        {/* RightRailMarketPanels - Orderbook/Trades/Trading/Info (executor'dan bağımsız) */}
        <RightRailMarketPanels
          symbol={symbol}
          executorReachable={executorReachable}
        />
      </div>

      {/* RSI Panel (PATCH: default açık, dikey alan garantisi) */}
      <div
        className="flex-shrink-0 border-t border-white/10 bg-neutral-900/20"
        style={{ height: "180px", minHeight: "180px" }}
      >
        <div className="px-4 py-2 border-b border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-neutral-400">
              RSI (14)
            </span>
            <span className="text-[11px] font-mono tabular-nums text-neutral-300">
              {currentRsi !== null ? currentRsi.toFixed(2) : "--"}
            </span>
          </div>
        </div>
        <div className="h-[calc(180px-40px)] relative overflow-hidden">
          <div ref={rsiChartContainerRef} className="w-full h-full" />
        </div>
      </div>

      {/* Footer info */}
      <div className="px-4 py-2 border-t border-white/10 bg-neutral-900/20 text-[10px] text-neutral-500 flex items-center justify-end">
        <div className="flex items-center gap-3 text-[11px] text-neutral-400">
          <span>Win: 68%</span>
          <span>·</span>
          <span>R:R 1:2.5</span>
          <span>·</span>
          <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">
            Regime: Trend
          </span>
          <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">
            Vol: High
          </span>
        </div>
      </div>
    </div>
  );
}
