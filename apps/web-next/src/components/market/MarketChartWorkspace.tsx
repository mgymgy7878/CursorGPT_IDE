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

import { useEffect, useRef, useState } from 'react';
// SSOT: createChart import sadece type'lar için (CrosshairMode, ColorType, Series types)
// Chart oluşturma createSparkChart helper'ı üzerinden yapılmalı (attributionLogo zorunlu false)
import { CrosshairMode, ColorType, CandlestickSeries, HistogramSeries, LineSeries } from 'lightweight-charts';
import type { IChartApi, ISeriesApi } from 'lightweight-charts';
import { cn } from '@/lib/utils';
import { formatCurrency, formatNumber } from '@/lib/format';
import { createSparkChart } from '@/lib/charts/createSparkChart';

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

  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe);
  const [ohlc, setOhlc] = useState({ o: 0, h: 0, l: 0, c: 0, v: 0 });
  const [currentRsi, setCurrentRsi] = useState<number | null>(null);

  const timeframes = ['1m', '5m', '15m', '1H', '4H', '1D', '1W', '1M'];

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

    // Generate and set data
    const candles = generateMockCandles(symbol, 200);
    const lastCandle = candles[candles.length - 1];

    setOhlc({
      o: lastCandle.open,
      h: lastCandle.high,
      l: lastCandle.low,
      c: lastCandle.close,
      v: lastCandle.volume,
    });

    candleSeries.setData(
      candles.map(c => ({
        time: c.time as any,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }))
    );

    volumeSeries.setData(
      candles.map(c => ({
        time: c.time as any,
        value: c.volume,
        color: c.close >= c.open ? '#16a34a66' : '#ef444466',
      }))
    );

    // Entry/TP/SL price lines (Figma parity - PATCH E)
    const currentPrice = lastCandle.close;
    const entryPrice = currentPrice * 0.995; // Entry %0.5 below
    const tpPrice = currentPrice * 1.03; // TP %3 above
    const slPrice = currentPrice * 0.97; // SL %3 below

    (candleSeries as any).createPriceLine({
      price: entryPrice,
      color: '#60a5fa',
      lineWidth: 2,
      lineStyle: 0, // solid
      axisLabelVisible: true,
      title: 'Entry',
    });

    (candleSeries as any).createPriceLine({
      price: tpPrice,
      color: '#4ade80',
      lineWidth: 2,
      lineStyle: 0, // solid
      axisLabelVisible: true,
      title: 'TP',
    });

    (candleSeries as any).createPriceLine({
      price: slPrice,
      color: '#f87171',
      lineWidth: 2,
      lineStyle: 0, // solid
      axisLabelVisible: true,
      title: 'SL',
    });

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

      // Generate RSI data (mock - 0-100 range)
      const rsiData = candles.map((c, i) => {
        // Simple RSI mock: oscillate between 30-70 with some randomness
        const baseRsi = 50 + Math.sin(i / 10) * 20 + (Math.random() - 0.5) * 10;
        return {
          time: c.time as any,
          value: Math.max(20, Math.min(80, baseRsi)),
        };
      });

      rsiSeries.setData(rsiData);

      // Set current RSI value (last data point)
      if (rsiData.length > 0) {
        setCurrentRsi(rsiData[rsiData.length - 1].value);
      }

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
      // Note: subscribeVisibleTimeRangeChange returns void, cleanup is handled by chart.remove()
      chart.timeScale().subscribeVisibleTimeRangeChange((timeRange) => {
        if (timeRange && rsiChartRef.current) {
          rsiChartRef.current.timeScale().setVisibleRange(timeRange);
        }
      });

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

      // Remove charts (price lines otomatik temizlenir)
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
  }, [symbol]);

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

            {/* Mode badge */}
            <span className="text-[10px] text-neutral-500 px-2 py-1 rounded bg-white/5 border border-white/10">
              Mock Data
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
      <div className="flex-1 min-h-0 relative overflow-hidden" style={{ minHeight: '300px' }}>
        <div ref={chartContainerRef} className="w-full h-full" />
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

