"use client";
import { useState } from "react";

export default function AlertForm() {
	const [symbol, setSymbol] = useState("BTCUSDT");
	const [rule, setRule] = useState("price>70000");
	const [windowFor, setWindowFor] = useState("10m");
	const [severity, setSeverity] = useState("warning");

	function toSlash() {
		const SYM=/^[A-Z0-9:_\-]{5,20}$/; if(!SYM.test(symbol)) return alert("Symbol geçersiz (örn. BTCUSDT).");
		const RULE=/^(price[<>]\d+|crosses:[A-Z0-9:_\-]+)$/i; if(!RULE.test(rule)) return alert("Rule örnekleri: price>65000 | price<60000 | crosses:EMA20");
		const cmd = `/alerts.create symbol=${symbol} rule=${rule} for=${windowFor} severity=${severity} --json`;
		window.dispatchEvent(new CustomEvent("spark.prefill", { detail: { cmd } }));
	}

	return (
		<div className="p-3 rounded-2xl border bg-white shadow-sm space-y-2">
			<div className="font-semibold">Alert oluştur</div>
			<div className="grid grid-cols-2 gap-2">
				<input className="border rounded px-2 py-1" value={symbol} onChange={e=>setSymbol(e.target.value)} placeholder="Symbol" />
				<input className="border rounded px-2 py-1" value={rule} onChange={e=>setRule(e.target.value)} placeholder="Rule (price>, price<, crosses)" />
				<input className="border rounded px-2 py-1" value={windowFor} onChange={e=>setWindowFor(e.target.value)} placeholder="for (örn. 10m)" />
				<select className="border rounded px-2 py-1" value={severity} onChange={e=>setSeverity(e.target.value)}>
					<option>info</option><option>warning</option><option>critical</option>
				</select>
			</div>
			<p className="text-[11px] text-neutral-500">Örnekler: rule=<code>price&gt;65000</code>, <code>price&lt;60000</code>, <code>crosses:EMA20</code></p>
			<div className="flex gap-2">
				<button onClick={toSlash} className="text-sm px-3 py-1.5 border rounded hover:bg-neutral-50">Slash’a çevir</button>
			</div>
		</div>
	);
} 