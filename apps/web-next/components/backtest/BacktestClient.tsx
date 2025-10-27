'use client';
import { useEffect, useRef, useState } from "react";

type Candle = { time: number; open: number; high: number; low: number; close: number };

enum Maybe { }

export default function BacktestClient() {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const [bars, setBars] = useState<Candle[]>([]);
	const [symbol,setSymbol] = useState('BTCUSDT');
	const [n,setN] = useState(240);
	const [busy,setBusy] = useState(false);
	const [tz,setTz] = useState<string>('');

	async function load(){
		setBusy(true);
		try{
			const body:any = { symbol, n };
			// ileriye dönük: from/to ms alanları burada body’ye eklenebilir
			const r = await fetch('/api/public/backtest/data',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
			const j = await r.json().catch(()=>({}));
			setBars(Array.isArray(j?.candles)? j.candles : []);
			setTz(String(j?.tz||''));
		} finally { setBusy(false); }
	}

	useEffect(()=>{ load(); },[]);

	useEffect(() => {
		let cleanup: (() => void) | undefined;
		(async () => {
			const lib = await import('lightweight-charts');
			if (!containerRef.current) return;
			const chart = lib.createChart(containerRef.current, {
				width: containerRef.current.clientWidth,
				height: 380,
                          layout: { background: { type: 'Solid' as any, color: 'transparent' }, textColor: '#0f172a' },
				grid: { vertLines: { visible: false }, horzLines: { visible: false } },
				rightPriceScale: { borderVisible: false },
				timeScale: { borderVisible: false, secondsVisible: false, rightBarStaysOnScroll: true },
				crosshair: { mode: lib.CrosshairMode.Normal },
			});
			const series = chart.addCandlestickSeries({ upColor: '#16a34a', downColor: '#ef4444', borderVisible: false, wickUpColor: '#16a34a', wickDownColor: '#ef4444' });
                  series.setData(bars as any);
			const ro = new ResizeObserver((entries) => {
				const { width } = entries[0].contentRect;
				chart.applyOptions({ width });
			});
			ro.observe(containerRef.current);
			cleanup = () => { ro.disconnect(); chart.remove(); };
		})();
		return () => cleanup?.();
	}, [bars]);

	return (
		<div className="p-4 space-y-3">
			<div className="flex items-center justify-between">
				<h2 className="text-lg font-semibold">Backtest</h2>
				<div className="flex gap-2 items-center text-sm">
					<input className="border rounded px-2 py-1 w-28" value={symbol} onChange={e=>setSymbol(e.target.value.toUpperCase())}/>
					<input className="border rounded px-2 py-1 w-20" type="number" min={50} max={2000} value={n} onChange={e=>setN(Number(e.target.value||240))}/>
					<button className="px-2 py-1 rounded bg-slate-200" disabled={busy} onClick={load}>Yükle</button>
				</div>
			</div>
			<div ref={containerRef} className="w-full rounded-xl border border-slate-200 overflow-hidden" />
			<p className="text-xs opacity-70">Veri: executor /backtest/data • symbol ve n ile yüklenir. {tz?`TZ: ${tz}`:''}</p>
		</div>
	);
} 