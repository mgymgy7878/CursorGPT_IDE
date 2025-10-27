'use client';
import { useEffect, useState } from "react";

type Stats = { global_decision?:'GREEN'|'YELLOW'|'RED' };

const Chip=({v}:{v?:Stats['global_decision']})=>{
	if(!v) return null;
	const c=v==='GREEN'?'bg-emerald-500':v==='YELLOW'?'bg-amber-500':'bg-rose-500';
	return <span className={`px-2 py-0.5 rounded text-white text-xs ${c}`}>{v}</span>;
};

export default function HealthBanner(){
	const [reach,setReach]=useState<boolean|null>(null);
	const [global,setGlobal]=useState<Stats['global_decision']|undefined>(undefined);
	const [ts,setTs]=useState(0);

	async function ping(){
		try{
			const r=await fetch('/api/public/healthz'); const j=await r.json(); setReach(!!j?.ok);
			const s=await fetch('/api/public/canary/stats',{method:'POST'}); const sj:Stats=await s.json();
			setGlobal(sj.global_decision); setTs(Date.now());
		}catch{ setReach(false); }
	}

	useEffect(()=>{ ping(); const id=setInterval(ping, 5000); return ()=>clearInterval(id); },[]);
	return (
		<div className="rounded-xl border p-3 flex items-center justify-between">
			<div className="flex items-center gap-3">
				<div>Executor: {reach===null?'…': reach? <b className="text-emerald-600">reachable</b> : <b className="text-rose-600">unreachable</b>}</div>
				<div>Global Decision: <Chip v={global}/></div>
			</div>
			<div className="text-xs opacity-60">last check: {ts?new Date(ts).toLocaleTimeString(): '—'}</div>
		</div>
	);
} 