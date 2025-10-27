'use client';
import { useEffect, useState } from "react";
export default function GuardrailsPage(){
	const [p,setP]=useState<any>({}); const [busy,setBusy]=useState(false);
	const load=async()=>{ const r=await fetch('/api/public/guardrails/policy.get',{method:'POST'}); setP(await r.json().then(j=>j.policy)); };
	useEffect(()=>{ load(); },[]);
	const save=async()=>{ setBusy(true); try{ await fetch('/api/public/guardrails/policy.set',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(p)}); } finally{ setBusy(false); } };
	return (
		<div className="p-4 space-y-3">
			<h2 className="text-lg font-semibold">Guardrails</h2>
			<div className="grid grid-cols-2 gap-3">
				<label className="text-sm">maxNotional <input className="border rounded px-2 py-1 ml-2" type="number" value={p?.maxNotional??0} onChange={e=>setP({...p, maxNotional:Number(e.target.value)})}/></label>
				<label className="text-sm">maxDrawdown <input className="border rounded px-2 py-1 ml-2" type="number" step="0.01" value={p?.maxDrawdown??0} onChange={e=>setP({...p, maxDrawdown:Number(e.target.value)})}/></label>
				<label className="text-sm col-span-2">allowedSymbols <input className="border rounded px-2 py-1 ml-2 w-2/3" value={(p?.allowedSymbols||[]).join(',')} onChange={e=>setP({...p, allowedSymbols:e.target.value.split(',').map((x)=>x.trim())})}/></label>
				<label className="text-sm">allowLive <input type="checkbox" className="ml-2" checked={!!p?.allowLive} onChange={e=>setP({...p, allowLive:e.target.checked})}/></label>
			</div>
			<div className="flex gap-2">
				<button className="px-3 py-2 rounded bg-slate-200" disabled={busy} onClick={save}>Kaydet</button>
				<button className="px-3 py-2 rounded bg-slate-200" onClick={load}>↻ Yenile</button>
			</div>
		</div>
	);
} 