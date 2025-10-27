"use client";
import { useState } from "react";

export default function RiskForm() {
	const [maxNotional, setMaxNotional] = useState(8000);
	const [drawdown, setDrawdown] = useState(10);
	const [exchange, setExchange] = useState("");

	function toSlash() {
		if (Number.isNaN(maxNotional) || maxNotional<=0) return alert("maxNotional > 0 olmalı.");
		if (Number.isNaN(drawdown) || drawdown<=0 || drawdown>50) return alert("drawdown 1–50 arası olmalı.");
		const parts = [`/risk.set maxNotional=${maxNotional}`, `drawdown=${drawdown}`];
		if (exchange.trim()) parts.push(`exchange=${exchange.trim()}`);
		const cmd = parts.join(" ") + " --json";
		window.dispatchEvent(new CustomEvent("spark.prefill", { detail: { cmd } }));
	}

	return (
		<div className="p-3 rounded-2xl border bg-white shadow-sm space-y-2">
			<div className="font-semibold">Risk ayarları</div>
			<div className="grid grid-cols-2 gap-2">
				<input type="number" className="border rounded px-2 py-1" value={maxNotional} onChange={e=>setMaxNotional(Number(e.target.value))} placeholder="maxNotional" />
				<input type="number" className="border rounded px-2 py-1" value={drawdown} onChange={e=>setDrawdown(Number(e.target.value))} placeholder="drawdown %" />
				<input className="border rounded px-2 py-1 col-span-2" value={exchange} onChange={e=>setExchange(e.target.value)} placeholder="exchange (opsiyonel)" />
			</div>
			<div className="flex gap-2">
				<button onClick={toSlash} className="text-sm px-3 py-1.5 border rounded hover:bg-neutral-50">Slash’a çevir</button>
			</div>
		</div>
	);
} 