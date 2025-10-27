"use client";
import { useState } from "react";
export default function ModelHintForm(){
	const [symbol,setSymbol]=useState("ETHUSDT");
	const [tf,setTf]=useState("4h");
	const [latency,setLatency]=useState(1200);
	const [tier,setTier]=useState("mid");
	function toSlash(){
		const SYM=/^[A-Z0-9:_\-]{5,20}$/; if(!SYM.test(symbol)) return alert("Symbol geçersiz");
		const cmd=`/model.hint symbol=${symbol} tf=${tf} max_latency_ms=${latency} cost_tier=${tier} --json`;
		window.dispatchEvent(new CustomEvent("spark.prefill",{detail:{cmd}}));
	}
	return (
		<div className="p-3 rounded-2xl border bg-white shadow-sm space-y-2">
			<div className="font-semibold">Model Hint</div>
			<div className="grid grid-cols-2 gap-2">
				<input className="border rounded px-2 py-1" value={symbol} onChange={e=>setSymbol(e.target.value)} placeholder="Symbol"/>
				<input className="border rounded px-2 py-1" value={tf} onChange={e=>setTf(e.target.value)} placeholder="tf (örn. 1h/4h)"/>
				<input type="number" className="border rounded px-2 py-1" value={latency} onChange={e=>setLatency(Number(e.target.value))} placeholder="max_latency_ms"/>
				<select className="border rounded px-2 py-1" value={tier} onChange={e=>setTier(e.target.value)}>
					<option value="low">low</option><option value="mid">mid</option><option value="high">high</option>
				</select>
			</div>
			<button onClick={toSlash} className="text-sm px-3 py-1.5 border rounded hover:bg-neutral-50">Slash’a çevir</button>
		</div>
	);
} 