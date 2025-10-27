"use client";
import { useState } from "react";
export default function CompareForm(){
	const [symbol,setSymbol]=useState("BTCUSDT");
	const [baseline,setBaseline]=useState(new Date(Date.now()-86400000).toISOString().slice(0,10));
	const [window,setWindow]=useState("24h");
	function toSlash(){
		const SYM=/^[A-Z0-9:_\-]{5,20}$/; if(!SYM.test(symbol)) return alert("Symbol geçersiz");
		const cmd=`/drift.compare symbol=${symbol} baseline=${baseline} window=${window} --json`;
          (window as any).dispatchEvent(new CustomEvent("spark.prefill",{detail:{cmd}}));
	}
	return (
		<div className="p-3 rounded-2xl border bg-white shadow-sm space-y-2">
			<div className="font-semibold">Drift Compare</div>
			<div className="grid grid-cols-2 gap-2">
				<input className="border rounded px-2 py-1" value={symbol} onChange={e=>setSymbol(e.target.value)} placeholder="Symbol"/>
				<input type="date" className="border rounded px-2 py-1" value={baseline} onChange={e=>setBaseline(e.target.value)} />
				<input className="border rounded px-2 py-1 col-span-2" value={window} onChange={e=>setWindow(e.target.value)} placeholder="window (örn. 24h)"/>
			</div>
			<button onClick={toSlash} className="text-sm px-3 py-1.5 border rounded hover:bg-neutral-50">Slash’a çevir</button>
		</div>
	);
} 