'use client';
import { useEffect, useState } from "react";
type Row = { params:any; metrics:{ pnl:number; sharpe:number; winRate:number; maxDD:number; trades:number } };
export default function LabPage(){
	const [strategies,setStrategies]=useState<string[]>([]);
	const [sid,setSid]=useState('ema-cross'); const [n,setN]=useState(20);
	const [grid,setGrid]=useState<any>({ fast:[5,30,1], slow:[20,60,2] });
	const [rows,setRows]=useState<Row[]>([]); const [busy,setBusy]=useState(false);

	useEffect(()=>{ (async()=>{ const r=await fetch('/api/public/lab/strategies',{method:'POST'}); setStrategies(await r.json().then(j=>j.ids)); })(); },[]);
	const runSweep=async()=>{ setBusy(true); try{ const r=await fetch('/api/public/lab/sweep',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ strategyId:sid, grid, n })}); const j=await r.json(); setRows(j.results||[]); } finally{ setBusy(false); } };
	const csv=()=>{ const head='pnl,sharpe,winRate,maxDD,trades,params'; const lines=rows.map(r=>[r.metrics.pnl,r.metrics.sharpe,r.metrics.winRate,r.metrics.maxDD,r.metrics.trades,JSON.stringify(r.params)].join(',')); const blob=new Blob([head+'\n'+lines.join('\n')],{type:'text/csv'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`lab_${sid}.csv`; a.click(); };

	return (
		<div className="p-4 space-y-3">
			<h2 className="text-lg font-semibold">Optimization Lab</h2>
			<div className="flex flex-wrap items-end gap-3">
				<div><label className="block text-xs">Strategy</label>
					<select className="border rounded px-2 py-1" value={sid} onChange={e=>setSid(e.target.value)}>{strategies.map(s=><option key={s}>{s}</option>)}</select>
				</div>
				<div><label className="block text-xs">N</label><input type="number" className="border rounded px-2 py-1 w-24" value={n} onChange={e=>setN(Number(e.target.value))}/></div>
				<button className="px-3 py-2 rounded bg-slate-200" disabled={busy} onClick={runSweep}>Run Sweep</button>
				<button className="px-3 py-2 rounded bg-slate-200" onClick={csv}>CSV Export</button>
			</div>
			<div className="rounded-xl border overflow-auto">
				<table className="w-full text-sm">
					<thead><tr><th>PNL</th><th>Sharpe</th><th>Win%</th><th>MaxDD</th><th>Trades</th><th>Params</th></tr></thead>
					<tbody>
						{rows.map((r,i)=>(<tr key={i} className="odd:bg-white even:bg-slate-50">
							<td>{r.metrics.pnl.toFixed(4)}</td><td>{r.metrics.sharpe.toFixed(3)}</td><td>{(r.metrics.winRate*100).toFixed(1)}%</td><td>{(r.metrics.maxDD*100).toFixed(1)}%</td><td>{r.metrics.trades}</td><td><code className="text-xs">{JSON.stringify(r.params)}</code></td>
						</tr>))}
					</tbody>
				</table>
			</div>
			<p className="text-xs opacity-60">Not: Şimdilik strateji koşumu stub; gerçek backtest entegresi bir sonraki adımda.</p>
		</div>
	);
} 