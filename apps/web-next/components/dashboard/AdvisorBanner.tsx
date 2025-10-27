'use client';
import { useEffect, useState } from "react";

type Adv = { decision?:string; advice?:string[] };
export default function AdvisorBanner(){
	const [d,setD]=useState<Adv|null>(null);
	const [busy,setBusy]=useState(false);
	async function load(){ const r=await fetch('/api/public/canary/advise',{method:'POST'}).catch(()=>null); setD(await r?.json().catch(()=>null)); }
	useEffect(()=>{ load(); const id=setInterval(load, 7000); return ()=>clearInterval(id); },[]);
	if (!d || (d?.decision==='GREEN' && (!d?.advice?.length))) return null;
	return (
		<div className="p-3 rounded-xl border bg-gradient-to-br from-sky-500/10 to-sky-500/5">
			<div className="flex items-center justify-between">
				<div className="font-medium">Advisor</div>
				<div className="flex gap-2">
					<a className="px-2 py-1 rounded bg-white/70 text-xs" href="/api/public/canary/advise/script?format=sh">Get patch (sh)</a>
					<a className="px-2 py-1 rounded bg-white/70 text-xs" href="/api/public/canary/advise/script?format=ps1">Get patch (ps1)</a>
					<button className="px-2 py-1 rounded bg-white/70 text-xs" disabled={busy} onClick={()=>{ setBusy(true); load().finally(()=>setBusy(false)); }}>↻</button>
				</div>
			</div>
			<ul className="mt-2 text-sm list-disc pl-5">
				{(d?.advice ?? []).map((s,i)=><li key={i}>{s}</li>)}
			</ul>
		</div>
	);
} 