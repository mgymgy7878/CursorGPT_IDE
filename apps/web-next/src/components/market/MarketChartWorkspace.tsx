/**
 * MarketChartWorkspace - Figma Parity Full View Chart
 *
 * TradingView-vari chart workspace:
 * - Top bar: Symbol pill + timeframe + Mode + OHLC + Vol
 * - Timeframe row: 1m 5m 15m 1H 4H 1D 1W 1M
 * - Right tool group: Pro / Araçlar / Replay / +/- / Çıkış
 * - Chart area: candles + volume histogram (lightweight-charts)
 */

'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
// SSOT: createChart import sadece type'lar için (CrosshairMode, ColorType, Series types)
// Chart oluşturma createSparkChart helper'ı üzerinden yapılmalı (attributionLogo zorunlu false)
import { CrosshairMode, ColorType, CandlestickSeries, HistogramSeries, LineSeries } from 'lightweight-charts';
import type { IChartApi, ISeriesApi } from 'lightweight-charts';
import { cn } from '@/lib/utils';
import { formatCurrency, formatNumber } from '@/lib/format';
import { createSparkChart } from '@/lib/charts/createSparkChart';
// MVL: Live market data hook + staleness badge
import { useMarketCandles } from '@/lib/marketdata/useMarketCandles';
import { MarketStalenessBadge } from '@/components/market/MarketStalenessBadge';

export interface MarketChartWorkspaceProps {
  symbol: string;
  timeframe?: string;
  onTimeframeChange?: (tf: string) => void;
  onClose?: () => void;
  isFullscreen?: boolean;
}

// Generate realistic mock OHLC data (random walk, not sine)
function generateMockCandles(symbol: string, count: number = 200) {
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = ((hash << 5) - hash) + symbol.charCodeAt(i);
    hash = hash & hash;
  }

  const candles: Array<{ time: number; open: number; high: number; low: number; close: number; volume: number }> = [];
  let price = 42000 + (Math.abs(hash) % 10000);
  const baseVolume = 1000000;

  for (let i = 0; i < count; i++) {
    const change = (Math.random() - 0.5) * 200 + (Math.sin(i / 20) * 50);
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
  timeframe = '1D',
  onTimeframeChange,
  onClose,
  isFullscreen = false,
}: MarketChartWorkspaceProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const rsiChartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const rsiChartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const rsiSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const rsiResizeObserverRef = useRef<ResizeObserver | null>(null);
  // PATCH: PriceLine registry for dedupe and cleanup
  const priceLinesRef = useRef<Map<string, any>>(new Map());

  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe);
  const [ohlc, setOhlc] = useState({ o: 0, h: 0, l: 0, c: 0, v: 0 });
  const [currentRsi, setCurrentRsi] = useState<number | null>(null);

  const timeframes = ['1m', '5m', '15m', '1H', '4H', '1D', '1W', '1M'];

  // MVL: Live market data (with mock fallback + SSE stream)
  const binanceSymbol = symbol.replace("/", ""); // BTC/USDT -> BTCUSDT
  const live = useMarketCandles({
    exchange: "binance",
    symbol: binanceSymbol,
    tf: selectedTimeframe.toLowerCase(), // "1m"
    limit: 500,
    enableStream: true, // SSE stream aktif
  });

  // Use live data if available, fallback to mock (memoized to prevent infinite loops)
  const candlesForChart = useMemo(() => {
    return (live.candles && live.candles.length > 0
      ? live.candles.map(c => ({
          time: Math.floor(c.t / 1000) as any, // ms -> unix timestamp (seconds)
          open: c.o,
          high: c.h,
          low: c.l,
          close: c.c,
          volume: c.v,
        }))
      : generateMockCandles(symbol, 200)
    );
  }, [live.candles, symbol]);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

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
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#e5e7eb',
      },
      grid: {
        horzLines: { color: '#1f2937' },
        vertLines: { color: '#1f2937' },
      },
      crosshair: { mode: CrosshairMode.Normal },
      timeScale: {
        rightOffset: 6,
        borderColor: '#374151',
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: '#374151',
        // PATCH: Chart alanını genişletmek için scale offset (TP/Entry ladder için alan)
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
    });

    // Not: TradingView attribution CSS ile gizleniyor (globals.css)
    // MutationObserver yerine CSS tercih ediliyor (daha "cerrahi" ve düşük risk)

    chartRef.current = chart;

    // Candlestick series (v5 API)
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#16a34a',
      downColor: '#ef4444',
      borderUpColor: '#16a34a',
      borderDownColor: '#ef4444',
      wickUpColor: '#16a34a',
      wickDownColor: '#ef4444',
    });
    candleSeriesRef.current = candleSeries as ISeriesApi<'Candlestick'>;

    // Volume histogram (v5 API)
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: '',
      lastValueVisible: false,
      priceLineVisible: false,
    });
    volumeSeriesRef.current = volumeSeries as ISeriesApi<'Histogram'>;

    // Volume scale options
    chart.priceScale('').applyOptions({
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
          background: { type: ColorType.Solid, color: 'transparent' },
          textColor: '#e5e7eb',
        },
        grid: {
          horzLines: { color: '#1f2937' },
          vertLines: { color: '#1f2937' },
        },
        crosshair: { mode: CrosshairMode.Normal },
        timeScale: {
          rightOffset: 6,
          borderColor: '#374151',
          timeVisible: true,
          secondsVisible: false,
        },
        rightPriceScale: {
          borderColor: '#374151',
          scaleMargins: { top: 0.1, bottom: 0.1 },
        },
      });

      // Not: TradingView attribution CSS ile gizleniyor (globals.css)

      rsiChartRef.current = rsiChart;

      // RSI Line series
      const rsiSeries = rsiChart.addSeries(LineSeries, {
        color: '#a855f7',
        lineWidth: 2,
        priceFormat: {
          type: 'price',
          precision: 1,
          minMove: 0.1,
        },
      });
      rsiSeriesRef.current = rsiSeries as ISeriesApi<'Line'>;

      // Note: RSI data will be set in a separate useEffect that has access to candlesForChart
      // For now, initialize with empty data to avoid crashes
      rsiSeries.setData([]);

      // RSI reference lines (30/70)
      (rsiSeries as any).createPriceLine({
        price: 70,
        color: '#ef4444',
        lineWidth: 1,
        lineStyle: 2, // dashed
        axisLabelVisible: true,
        title: '70',
      });

      (rsiSeries as any).createPriceLine({
        price: 30,
        color: '#4ade80',
        lineWidth: 1,
        lineStyle: 2, // dashed
        axisLabelVisible: true,
        title: '30',
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
      const rsiRo = new ResizeObserver(entries => {
        if (entries[0] && rsiChartRef.current) {
          const w = entries[0].contentRect.width;
          if (w > 0) {
            rsiChartRef.current.applyOptions({ width: Math.max(320, Math.floor(w)) });
          }
        }
      });

      rsiResizeObserverRef.current = rsiRo;
      rsiRo.observe(rsiChartContainerRef.current);
    }

    // ResizeObserver for main chart
    const ro = new ResizeObserver(entries => {
      if (entries[0] && chartRef.current) {
        const w = entries[0].contentRect.width;
        const h = entries[0].contentRect.height;
        if (w > 0 && h > 0) {
          chartRef.current.applyOptions({
            width: Math.max(320, Math.floor(w)),
            height: Math.max(200, Math.floor(h))
          });
        }
      }
    });

    ro.observe(chartContainerRef.current);

    // Cleanup (StrictMode-safe: double-mount koruması)
    return () => {
      // Disconnect ResizeObservers
      ro.disconnect();
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
        if (typeof series.removePriceLine === 'function') {
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
    if (!candleSeriesRef.current || !volumeSeriesRef.current || candlesForChart.length === 0) {
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

    candleSeriesRef.current.setData(
      candlesForChart.map(c => ({
        time: c.time as any,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }))
    );

    volumeSeriesRef.current.setData(
      candlesForChart.map(c => ({
        time: c.time as any,
        value: c.volume,
        color: c.close >= c.open ? '#16a34a66' : '#ef444466',
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
    const currentPrice = lastCandle.close;
    const entryPrice = Number((currentPrice * 0.995).toFixed(2)); // Entry %0.5 below
    const tpPrice = Number((currentPrice * 1.03).toFixed(2)); // TP %3 above
    const slPrice = Number((currentPrice * 0.97).toFixed(2)); // SL %3 below

    // Normalize: unique levels by kind
    const desiredLevels = new Map<string, { kind: string; price: number; color: string; title: string }>();
    desiredLevels.set(`ENTRY:${entryPrice}`, { kind: 'ENTRY', price: entryPrice, color: '#60a5fa', title: 'EN' });
    desiredLevels.set(`TP:${tpPrice}`, { kind: 'TP', price: tpPrice, color: '#4ade80', title: 'TP' });
    desiredLevels.set(`SL:${slPrice}`, { kind: 'SL', price: slPrice, color: '#f87171', title: 'SL' });

    if (!candleSeriesRef.current) return;

    const series = candleSeriesRef.current as any;
    const existingKeys = new Set(priceLinesRef.current.keys());

    // PATCH: Remove priceLines that are no longer needed (with runtime guard)
    existingKeys.forEach((key) => {
      if (!desiredLevels.has(key)) {
        const handle = priceLinesRef.current.get(key);
        // Runtime guard: Check if removePriceLine API exists (lightweight-charts version compatibility)
        if (handle && typeof (series as any).removePriceLine === 'function') {
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
            title: '', // Empty title since axisLabelVisible is false
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
  }, [candlesForChart]);

  const handleTimeframeClick = (tf: string) => {
    setSelectedTimeframe(tf);
    onTimeframeChange?.(tf);
  };

  return (
    <div className="h-full flex flex-col bg-neutral-950 overflow-hidden">
      {/* PATCH: Top Bar - Fullscreen modunda minimal bar (Figma gibi) */}
      {isFullscreen ? (
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-neutral-900/30" style={{ gap: 'var(--header-gap, 8px)' }}>
          <div className="flex items-center gap-3" style={{ gap: 'var(--header-gap, 8px)' }}>
            {/* Symbol pill */}
            <span className="px-3 py-1 rounded-full text-[12px] font-semibold bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
              {symbol}
            </span>
            {/* MVL: Staleness badge */}
            <MarketStalenessBadge status={live.status} />
            {/* Timeframe chips */}
            {timeframes.map((tf) => (
              <button
                key={tf}
                onClick={() => handleTimeframeClick(tf)}
                className={cn(
                  'px-2.5 py-1 text-[11px] font-medium rounded transition-colors',
                  selectedTimeframe === tf
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
                )}
              >
                {tf}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5" style={{ gap: 'calc(var(--header-gap, 8px) * 0.75)' }}>
            <button className="px-2 py-1 text-[11px] font-medium rounded text-neutral-400 hover:text-neutral-200 hover:bg-white/5">
              Pro
            </button>
            <button className="px-2 py-1 text-[11px] font-medium rounded text-neutral-400 hover:text-neutral-200 hover:bg-white/5">
              Araçlar
            </button>
            <button className="px-2 py-1 text-[11px] font-medium rounded text-neutral-400 hover:text-neutral-200 hover:bg-white/5">
              Replay
            </button>
            <button className="px-2 py-1 text-[11px] font-medium rounded text-neutral-400 hover:text-neutral-200 hover:bg-white/5">
              +
            </button>
            <button className="px-2 py-1 text-[11px] font-medium rounded text-neutral-400 hover:text-neutral-200 hover:bg-white/5">
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
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-neutral-900/30" style={{ gap: 'var(--header-gap, 8px)' }}>
          <div className="flex items-center gap-3" style={{ gap: 'var(--header-gap, 8px)' }}>
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
            {/* MVL: Staleness badge */}
            <MarketStalenessBadge status={live.status} />
            <span className="text-[11px] text-neutral-500">1D · Trend Follower v1</span>
          </div>

          <div className="flex items-center gap-4" style={{ gap: 'var(--header-gap, 8px)' }}>
            {/* OHLC + Vol */}
            <div className="flex items-center gap-3 text-[11px] font-mono tabular-nums" style={{ gap: 'var(--header-gap, 8px)' }}>
              <div>
                <span className="text-neutral-500">O:</span>{' '}
                <span className="text-neutral-300">{formatCurrency(ohlc.o, 'USD')}</span>
              </div>
              <div>
                <span className="text-neutral-500">H:</span>{' '}
                <span className="text-neutral-300">{formatCurrency(ohlc.h, 'USD')}</span>
              </div>
              <div>
                <span className="text-neutral-500">L:</span>{' '}
                <span className="text-neutral-300">{formatCurrency(ohlc.l, 'USD')}</span>
              </div>
              <div>
                <span className="text-neutral-500">C:</span>{' '}
                <span className="text-neutral-300">{formatCurrency(ohlc.c, 'USD')}</span>
              </div>
              <div>
                <span className="text-neutral-500">Vol:</span>{' '}
                <span className="text-neutral-300">{formatNumber(ohlc.v / 1000)}K</span>
              </div>
            </div>

            {/* Mode badge - Live/Mock indicator */}
            <span className={cn(
              "text-[10px] px-2 py-1 rounded border",
              live.source === 'feed' || live.source === 'binance'
                ? "text-emerald-400 bg-emerald-500/20 border-emerald-500/30"
                : "text-neutral-500 bg-white/5 border-white/10"
            )}>
              {live.source === 'feed' ? 'Live' : live.source === 'binance' ? 'Live (Binance)' : 'Mock Data'}
            </span>
          </div>
        </div>
      )}

      {/* PATCH U: Timeframe Row - Figma parity spacing (sadece workspace modunda) */}
      {!isFullscreen && (
        <div className="flex items-center gap-1 px-4 py-2 border-b border-white/10 bg-neutral-900/20" style={{ gap: 'calc(var(--header-gap, 8px) * 0.5)' }}>
          {timeframes.map((tf) => (
            <button
              key={tf}
              onClick={() => handleTimeframeClick(tf)}
              className={cn(
                'px-2.5 py-1 text-[11px] font-medium rounded transition-colors',
                selectedTimeframe === tf
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
              )}
            >
              {tf}
            </button>
          ))}
          <div className="flex-1" />
          {/* PATCH U: Right tool group - Figma parity spacing */}
          <div className="flex items-center gap-1.5" style={{ gap: 'calc(var(--header-gap, 8px) * 0.75)' }}>
            <button className="px-2 py-1 text-[11px] font-medium rounded text-neutral-400 hover:text-neutral-200 hover:bg-white/5">
              Pro
            </button>
            <button className="px-2 py-1 text-[11px] font-medium rounded text-neutral-400 hover:text-neutral-200 hover:bg-white/5">
              Araçlar
            </button>
            <button className="px-2 py-1 text-[11px] font-medium rounded text-neutral-400 hover:text-neutral-200 hover:bg-white/5">
              Replay
            </button>
            <button className="px-2 py-1 text-[11px] font-medium rounded text-neutral-400 hover:text-neutral-200 hover:bg-white/5">
              +
            </button>
            <button className="px-2 py-1 text-[11px] font-medium rounded text-neutral-400 hover:text-neutral-200 hover:bg-white/5">
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
      {/* PATCH: Chart container overflow kontrolü + sağda compact sidebar için flex layout */}
      <div className="flex-1 min-h-0 relative overflow-hidden flex" style={{ minHeight: '300px' }}>
        <div ref={chartContainerRef} className="flex-1 min-w-0 h-full" />
        {/* PATCH: Compact TP/Entry ladder sidebar (max 140px, scrollable if needed) */}
        {/* PATCH: Compact TP/Entry ladder sidebar (max 140px, scrollable if needed) */}
        {/* PATCH: Unique levels only (dedupe by price) */}
        {(() => {
          const currentPrice = ohlc.c || 0;
          const entryPrice = Number((currentPrice * 0.995).toFixed(2));
          const tpPrice = Number((currentPrice * 1.03).toFixed(2));
          const slPrice = Number((currentPrice * 0.97).toFixed(2));

          // PATCH: Unique levels (dedupe by price)
          const uniqueLevels = [
            { kind: 'TP', price: tpPrice, color: 'emerald', count: 1 },
            { kind: 'Entry', price: entryPrice, color: 'blue', count: 1 },
            { kind: 'SL', price: slPrice, color: 'red', count: 1 },
          ].filter(level => level.price > 0);

          return (
            <div className="flex-shrink-0 w-[140px] border-l border-white/10 bg-neutral-900/40 overflow-y-auto overflow-x-hidden">
              <div className="p-1.5 space-y-0.5">
                {/* TP Orders - unique only */}
                {uniqueLevels.filter(l => l.kind === 'TP').length > 0 && (
                  <>
                    <div className="text-[9px] text-neutral-500 mb-1 px-1 font-medium">TP</div>
                    {uniqueLevels
                      .filter(l => l.kind === 'TP')
                      .map((level, i) => (
                        <div key={`tp-${i}`} className="px-1.5 py-0.5 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 rounded leading-tight">
                          {level.price.toFixed(2)}
                        </div>
                      ))}
                  </>
                )}
                {/* Entry Orders - unique only */}
                {uniqueLevels.filter(l => l.kind === 'Entry').length > 0 && (
                  <>
                    <div className="text-[9px] text-neutral-500 mb-1 mt-2 px-1 font-medium">Entry</div>
                    {uniqueLevels
                      .filter(l => l.kind === 'Entry')
                      .map((level, i) => (
                        <div key={`entry-${i}`} className="px-1.5 py-0.5 text-[10px] font-mono text-blue-400 bg-blue-500/10 rounded leading-tight">
                          {level.price.toFixed(2)}
                        </div>
                      ))}
                  </>
                )}
                {/* SL Orders - unique only */}
                {uniqueLevels.filter(l => l.kind === 'SL').length > 0 && (
                  <>
                    <div className="text-[9px] text-neutral-500 mb-1 mt-2 px-1 font-medium">SL</div>
                    {uniqueLevels
                      .filter(l => l.kind === 'SL')
                      .map((level, i) => (
                        <div key={`sl-${i}`} className="px-1.5 py-0.5 text-[10px] font-mono text-red-400 bg-red-500/10 rounded leading-tight">
                          {level.price.toFixed(2)}
                        </div>
                      ))}
                  </>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      {/* RSI Panel (PATCH: default açık, dikey alan garantisi) */}
      <div className="flex-shrink-0 border-t border-white/10 bg-neutral-900/20" style={{ height: '180px', minHeight: '180px' }}>
        <div className="px-4 py-2 border-b border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-neutral-400">RSI (14)</span>
            <span className="text-[11px] font-mono tabular-nums text-neutral-300">
              {currentRsi !== null ? currentRsi.toFixed(2) : '--'}
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
          <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">Regime: Trend</span>
          <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">Vol: High</span>
        </div>
      </div>
    </div>
  );
}

