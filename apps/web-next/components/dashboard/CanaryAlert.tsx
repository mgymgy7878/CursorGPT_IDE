'use client';
import { useEffect, useState } from "react";

type Row = { ex:'binance'|'btcturk'; ack_p95_ms:number; e2db_p95_ms:number; fills_p95_ms:number; confirm_total:number; fail_total:number; decision:'GREEN'|'YELLOW'|'RED' };

export default function CanaryAlert(){
	const [rows,setRows]=useState<Row[]>([]);
	const load=async()=>{ const r=await fetch('/api/public/canary/matrix',{method:'POST'}).catch(()=>null); setRows(await r?.json().then(j=>j.rows).catch(()=>[])||[]); };
	useEffect(()=>{ load(); const id=setInterval(load, 5000); return ()=>clearInterval(id); },[]);

	const bad = rows.filter(r=> r.decision!=='GREEN');
	if (!bad.length) return null;

	const adviceFor = (r:Row) => {
		const tips:string[]=[];
		if (r.fail_total>0) tips.push('Fail > 0: minQty/stepSize ve imza/retry kontrollerini doğrula.');
		if (r.ack_p95_ms>=1000) tips.push('ACK p95 yüksek: HTTP keep-alive, agent pooling ve recvWindow artırımı önerilir.');
		if (r.e2db_p95_ms>=300) tips.push('Event→DB p95 yüksek: DB batch flush ≤50ms, pool limit=10.');
		if (r.fills_p95_ms>=2000) tips.push('Fills p95 yüksek: lot/qty küçült, poll intervalini ayarla veya likiditesi yüksek çifte geç.');
		return tips.length? tips : ['Tanısal öneri üretilemedi'];
	};

	return (
		<div className="p-3 rounded-xl border bg-gradient-to-br from-amber-500/10 to-amber-500/5">
			<div className="flex items-center justify-between">
				<div className="font-medium">Canary Warnings</div>
				<button className="px-2 py-1 rounded bg-white/70 text-xs" onClick={load}>↻ Refresh</button>
			</div>
			<ul className="mt-2 text-sm space-y-2">
				{bad.map((r,i)=>(
					<li key={i} className="p-2 rounded-lg bg-white/50">
						<b className="capitalize">{r.ex}</b>: {adviceFor(r).join(' | ')}
					</li>
				))}
			</ul>
		</div>
	);
} 