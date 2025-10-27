'use client';
import { useEffect, useState } from "react";

type Row = { ex:'binance'|'btcturk'; ack_p95_ms:number; e2db_p95_ms:number; fills_p95_ms:number; confirm_total:number; fail_total:number; decision:'GREEN'|'YELLOW'|'RED' };
const Chip = ({d}:{d:Row['decision']})=>{
	const c = d==='GREEN'?'bg-emerald-500': d==='YELLOW'?'bg-amber-500':'bg-rose-500';
	return <span className={`px-2 py-0.5 rounded text-white text-xs ${c}`}>{d}</span>;
};
export default function CanaryMatrix(){
	const [rows,setRows]=useState<Row[]>([]);
	const load=async()=>{ const r=await fetch('/api/public/canary/matrix',{method:'POST'}).catch(()=>null); setRows(await r?.json().then(j=>j.rows).catch(()=>[])||[]); };
	useEffect(()=>{ load(); },[]);
	return (
		<div className="rounded-xl border p-3">
			<div className="font-medium mb-2">Canary Matrix</div>
			<table className="w-full text-sm">
				<thead>
					<tr className="text-left">
						<th>Exchange</th><th>Decision</th><th>ACK P95</th><th>E2DB P95</th><th>Fills P95</th><th>Confirm</th><th>Fail</th>
					</tr>
				</thead>
				<tbody>
					{rows.map((r,i)=>(
						<tr key={i} className="odd:bg-white even:bg-slate-50">
							<td className="capitalize">{r.ex}</td>
							<td><Chip d={r.decision} /></td>
							<td>{Math.round(r.ack_p95_ms||0)} ms</td>
							<td>{Math.round(r.e2db_p95_ms||0)} ms</td>
							<td>{Math.round(r.fills_p95_ms||0)} ms</td>
							<td>{r.confirm_total ?? 0}</td>
							<td className="text-rose-600">{r.fail_total ?? 0}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
} 