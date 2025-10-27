'use client';
import { useEffect, useState } from "react";

type Stats = { ack_p95_ms?:number; e2db_p95_ms?:number; fill_p95_ms?:number; confirm_total?:number; fail_total?:number; decision?:'GREEN'|'YELLOW'|'RED' };

export default function CanaryKPI(){
	const [s,setS]=useState<Stats>({});
	const [busy,setBusy]=useState(false);
	const fetchStats = async ()=>{
		const r=await fetch('/api/public/canary/stats',{method:'POST'}).catch(()=>null);
		setS(await r?.json().catch(()=>({})) || {});
	};
	useEffect(()=>{ fetchStats(); },[]);
	const chip = (d:Stats['decision']) => d==='GREEN'?'bg-emerald-500':d==='YELLOW'?'bg-amber-500':'bg-rose-500';
	const seed = async ()=>{ setBusy(true); try{ await fetch('/api/public/canary/run',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({n:3})}); await fetchStats(); } finally { setBusy(false); } };
	return (
		<div className="p-3 rounded-xl border border-slate-200 flex items-center justify-between">
			<div className="font-medium">Canary</div>
			<div className="flex items-center gap-3 text-sm">
				<span className={`px-2 py-0.5 rounded text-white ${chip(s.decision)}`}>{s.decision ?? '—'}</span>
				<span>ACK P95: <b>{s.ack_p95_ms ?? 0}</b>ms</span>
				<span>E2DB P95: <b>{s.e2db_p95_ms ?? 0}</b>ms</span>
				<span>Fills P95: <b>{(s as any).fill_p95_ms ?? 0}</b>ms</span>
				<span>OK: <b>{s.confirm_total ?? 0}</b></span>
				<span>Fail: <b>{s.fail_total ?? 0}</b></span>
				{(s.confirm_total??0)===0 ? <button className="px-2 py-1 rounded bg-slate-200" disabled={busy} onClick={seed}>Seed ×3</button> : null}
			</div>
		</div>
	);
} 