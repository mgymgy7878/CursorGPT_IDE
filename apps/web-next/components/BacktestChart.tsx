import React, { useEffect, useMemo, useRef } from "react";
import * as lib from "lightweight-charts";
// import type { BacktestResult } from "@spark/shared" as any;
type BacktestResult = any;

type LinePoint = { time: number | string | Date; value: number };

type Props =
  | { data: BacktestResult; priceData?: never; equityData?: never; markers?: never; height?: number }
  | { data?: never; priceData: LinePoint[]; equityData: LinePoint[]; markers?: any[]; height?: number };

const MAX_INITIAL_POINTS = 5000;

// ---- Idle types (mini; global augment YOK) ---------------------------------
 type IdleDeadline = { didTimeout: boolean; timeRemaining: () => number };
 type IdleRequestCallback = (deadline: IdleDeadline) => void;

function ric(cb: IdleRequestCallback): number {
  const w = window as any;
  if (typeof w.requestIdleCallback === 'function') return w.requestIdleCallback(cb);
  return window.setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 0 }), 32);
}
function cic(id: number) {
  const w = window as any;
  if (typeof w.cancelIdleCallback === 'function') return w.cancelIdleCallback(id);
  window.clearTimeout(id);
}

// ---- Saf yardımcılar --------------------------------------------------------
function toUtcTs(x: number | string | Date): any {
  if (typeof x === 'number') return Math.floor(x / 1000) as any;
  const d = x instanceof Date ? x : new Date(x);
  return Math.floor(d.getTime() / 1000) as any;
}
function normalizePoints(xs: LinePoint[]) {
  return (xs ?? []).map(p => ({ time: toUtcTs(p.time), value: p.value }));
}
function decimate(points: { time: any; value: number }[], max = MAX_INITIAL_POINTS) {
  if (points.length <= max) return points;
  const stride = Math.ceil(points.length / max);
  const out: typeof points = [];
  for (let i = 0; i < points.length; i += stride) out.push(points[i]);
  return out;
}
function mapBacktestResult(r: BacktestResult) {
  const price = (r as any).price as LinePoint[] | undefined;
  const equity = (r as any).equity as LinePoint[] | undefined;

  const pricePoints = (price ?? []).map(p => ({ time: toUtcTs(p.time), value: p.value }));
  const equityPoints = (equity ?? []).map(p => ({ time: toUtcTs(p.time), value: p.value }));

  const markers = (r.trades ?? []).flatMap((t: any) => {
    const entry = {
      time: toUtcTs(t.entryTime),
      position: t.side === 'LONG' ? 'belowBar' : 'aboveBar',
      shape: t.side === 'LONG' ? 'arrowUp' : 'arrowDown',
      color: t.side === 'LONG' ? '#16a34a' : '#ef4444',
      text: `${t.side} @ ${t.entryPrice}`,
    } as const;
    const exit = {
      time: toUtcTs(t.exitTime),
      position: 'aboveBar',
      shape: 'cross',
      color: '#64748b',
      text: `EXIT @ ${t.exitPrice} PnL ${Number(t.pnl).toFixed(2)}`,
    } as const;
    return [entry, exit];
  });

  return { pricePoints, equityPoints, markers };
}

// ----------------------------------------------------------------------------
const BacktestChart: React.FC<Props> = (props) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<any | null>(null);
  const priceSeriesRef = useRef<any>(null);
  const equitySeriesRef = useRef<any>(null);
  const markersPluginRef = useRef<any | null>(null);
  const idleIdRef = useRef<number | null>(null);
  const roRef = useRef<ResizeObserver | null>(null);

  const height = props.height ?? 320;

  // ---- Union prop bağımlılıklarını sabitle (deps için tek kaynak) ----------
  const dataDep   = ('data' in props ? props.data : undefined);
  const priceDep  = ('priceData' in props ? props.priceData : undefined);
  const equityDep = ('equityData' in props ? props.equityData : undefined);
  const markersDep= ('markers' in props ? props.markers : undefined);

  // Giriş verisini sabit referansla çıkar
  const { pricePoints, equityPoints, markers } = useMemo(() => {
    if (dataDep) return mapBacktestResult(dataDep);
    const pp = priceDep  ? normalizePoints(priceDep)  : [];
    const ep = equityDep ? normalizePoints(equityDep) : [];
    const mk = markersDep ?? [];
    return { pricePoints: pp, equityPoints: ep, markers: mk };
  }, [dataDep, priceDep, equityDep, markersDep]);

  // Decimate edilmiş + full veri
  const decimated = useMemo(
    () => ({ price: decimate(pricePoints), equity: decimate(equityPoints) }),
    [pricePoints, equityPoints]
  );

  // Mount: chart + seriler + resize observer
  useEffect(() => {
    if (!containerRef.current) return;
    // node'u sabitle; cleanup'ta aynı referansı kullan
    const node = containerRef.current;

    const chart = (lib as any).createChart(node, {
      height,
      layout: { textColor: '#111827', background: { color: 'transparent' } },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false },
    });
    chartRef.current = chart;

    // v5: addSeries(LineSeries,…); v3/v4 fallback: addLineSeries
    const anyChart = chart as any;
    const price =
      typeof anyChart.addSeries === 'function'
        ? chart.addSeries((lib as any).LineSeries, { priceLineVisible: false })
        : anyChart.addLineSeries({ priceLineVisible: false });
    const equity =
      typeof anyChart.addSeries === 'function'
        ? chart.addSeries((lib as any).LineSeries, { priceLineVisible: false, color: '#6b7280' })
        : anyChart.addLineSeries({ priceLineVisible: false, color: '#6b7280' });

    priceSeriesRef.current = price;
    equitySeriesRef.current = equity;

    // v5 markers plugin; yoksa (v3/v4) series.setMarkers fallback
    try {
      markersPluginRef.current = (lib as any).createSeriesMarkers(price, []);
    } catch {
      markersPluginRef.current = null;
    }

    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const cr = e.contentRect;
        chart.applyOptions({ width: Math.floor(cr.width), height });
      }
    });
    ro.observe(node);
    roRef.current = ro;

    return () => {
      if (idleIdRef.current != null) { cic(idleIdRef.current); idleIdRef.current = null; }
      if (roRef.current && node) roRef.current.unobserve(node);
      roRef.current?.disconnect(); roRef.current = null;
      chart.remove();
      chartRef.current = null;
      priceSeriesRef.current = null;
      equitySeriesRef.current = null;
      markersPluginRef.current = null;
    };
    // sadece mount/unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // height güncellemesi aşağıda

  // Yükseklik değişimi
  useEffect(() => {
    if (chartRef.current) chartRef.current.applyOptions({ height });
  }, [height]);

  // Veri bağlama: önce decimated → idle'da full
  useEffect(() => {
    const chart = chartRef.current;
    const ps = priceSeriesRef.current;
    const es = equitySeriesRef.current;
    if (!chart || !ps || !es) return;

    const t0 = performance.now();
    ps.setData(decimated.price);
    es.setData(decimated.equity);

    // Marker set (plugin varsa onu kullan; yoksa eski setMarkers)
    if (markersPluginRef.current?.setMarkers) {
      markersPluginRef.current.setMarkers(markers ?? []);
    } else if (typeof ps.setMarkers === 'function') {
      ps.setMarkers(markers ?? []);
    }

    chart.timeScale().fitContent();
    const t1 = performance.now();
    // eslint-disable-next-line no-console
    console.log('[BacktestChart] first-draw-ms=', Math.round(t1 - t0), 'points=', decimated.price.length);

    // Idle hydrate
    if (idleIdRef.current != null) { cic(idleIdRef.current); idleIdRef.current = null; }
    idleIdRef.current = ric(() => {
      if (!chartRef.current || !priceSeriesRef.current || !equitySeriesRef.current) return;
      priceSeriesRef.current.setData(pricePoints);
      equitySeriesRef.current.setData(equityPoints);
      if (markersPluginRef.current?.setMarkers) {
        markersPluginRef.current.setMarkers(markers ?? []);
      } else if (typeof priceSeriesRef.current.setMarkers === 'function') {
        priceSeriesRef.current.setMarkers(markers ?? []);
      }
    });

    return () => {
      if (idleIdRef.current != null) { cic(idleIdRef.current); idleIdRef.current = null; }
    };
  }, [decimated.price, decimated.equity, pricePoints, equityPoints, markers]);

  return <div ref={containerRef} style={{ width: '100%', height }} />;
};

export default BacktestChart; 
