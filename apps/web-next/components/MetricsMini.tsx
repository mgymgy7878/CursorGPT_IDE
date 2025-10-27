"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Sparkline from "./ui/Sparkline";
import { useLocalStorage } from "../lib/ui/persist";

// Basit Prometheus parser (text -> Map<metricName, number>)
function parsePromText(text: string): Map<string, number> {
	const map = new Map<string, number>();
	const lines = text.split(/\r?\n/);
	for (const line of lines) {
		if (!line || line.startsWith("#")) continue;
		// ör: metric_name{labels} 123.45
		const m = line.match(/^([a-zA-Z_:][a-zA-Z0-9_:]*)(?:\{.*\})?\s+(-?\d+(?:\.\d+)?(?:e[+-]?\d+)?)$/);
		if (m) {
			const name = m[1];
			const val = Number(m[2]);
			if (!Number.isNaN(val)) map.set(name, val);
		}
	}
	return map;
}

// ---- Preset tanımları
type PresetKey = "core" | "trading" | "node" | "custom";
const PRESETS: Record<PresetKey, { label: string; metrics: string[] }> = {
	core: {
		label: "Core",
		metrics: [
			"process_cpu_seconds_total",
			"process_resident_memory_bytes",
			"http_request_duration_seconds_sum",
			"http_request_duration_seconds_count",
		],
	},
	trading: {
		label: "Trading",
		metrics: [
			"orders_submitted_total",
			"orders_filled_total",
			"positions_open_total",
			"broker_ws_messages_total",
		],
	},
	node: {
		label: "Node",
		metrics: [
			"nodejs_eventloop_lag_seconds",
			"nodejs_active_handles_total",
			"nodejs_active_requests_total",
			"nodejs_heap_space_size_used_bytes",
		],
	},
	custom: { label: "Custom", metrics: [] },
};

function metricsForPreset(key: PresetKey): string[] {
	return PRESETS[key]?.metrics ?? [];
}

type Row = { name: string; value: number; hist: number[] };

type Props = { open: boolean; onClose: () => void };

export default function MetricsMini({ open, onClose }: Props) {
	// ---- Persisted UI state
	const [preset, setPreset] = useLocalStorage<PresetKey>("mm:preset", "core");
	const [selected, setSelected] = useLocalStorage<string[]>(
		"mm:selected",
		metricsForPreset("core")
	);
	const [endpoint, setEndpoint] = useLocalStorage<string>(
		"mm:endpoint",
		"/api/public/metrics/prom"
	);
	const [intervalMs, setIntervalMs] = useLocalStorage<number>("mm:interval", 5000);

	const [rows, setRows] = useState<Row[]>([]);
	const histRef = useRef<Map<string, number[]>>(new Map());
	const timerRef = useRef<number | NodeJS.Timeout | null>(null);

	useEffect(() => {
		if (preset !== "custom") {
			const list = metricsForPreset(preset);
			setSelected(prev => (arraysEqual(prev, list) ? prev : list));
		}
	}, [preset, setSelected]);

	const fetchOnce = useCallback(async () => {
		try {
			const res = await fetch(endpoint, { cache: "no-store" });
			if (!res.ok) return;
			const text = await res.text();
			const map = parsePromText(text);

			const next: Row[] = [];
			for (const name of selected) {
				const v = map.get(name);
				if (typeof v === "number") {
					const current = histRef.current.get(name) ?? [];
					const updated = [...current.slice(-49), v];
					histRef.current.set(name, updated);
					next.push({ name, value: v, hist: updated });
				} else {
					const current = histRef.current.get(name) ?? [];
					histRef.current.set(name, current);
					next.push({ name, value: NaN, hist: current });
				}
			}
			setRows(next);
		} catch {}
	}, [endpoint, selected]);

	useEffect(() => {
		if (!open) { if (timerRef.current) clearInterval(timerRef.current as any), timerRef.current = null; return; }
		fetchOnce();
		timerRef.current = setInterval(fetchOnce, Math.max(1000, intervalMs)) as any;
		return () => { if (timerRef.current) clearInterval(timerRef.current as any), timerRef.current = null; };
	}, [open, fetchOnce, intervalMs]);

	const addMetric = useCallback((m: string) => {
		if (!m) return;
		setSelected(list => (list.includes(m) ? list : [...list, m]));
		setPreset("custom");
	}, [setPreset, setSelected]);

	const removeMetric = useCallback((name: string) => {
		setSelected(list => list.filter(x => x !== name));
		setPreset("custom");
	}, [setPreset, setSelected]);

	if (!open) return null;

	const header = (
		<div className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
			<div className="flex items-center gap-2">
				<span className="text-sm opacity-70">Preset</span>
				<select
					className="rounded-md border px-2 py-1 text-sm"
					value={preset}
					onChange={(e) => setPreset(e.target.value as PresetKey)}
				>
					{Object.entries(PRESETS).map(([k, v]) => (
						<option key={k} value={k}>{v.label}</option>
					))}
				</select>

				<span className="ml-3 text-sm opacity-70">Endpoint</span>
				<input
					className="w-[260px] rounded-md border px-2 py-1 text-sm"
					value={endpoint}
					onChange={(e) => setEndpoint(e.target.value)}
					placeholder="/api/public/metrics/prom"
				/>

				<span className="ml-3 text-sm opacity-70">Interval</span>
				<input
					type="number"
					min={1000}
					step={500}
					className="w-[90px] rounded-md border px-2 py-1 text-sm"
					value={intervalMs}
					onChange={(e) => setIntervalMs(Math.max(1000, Number(e.target.value) || 5000))}
				/>
			</div>

			<div className="flex items-center gap-2">
				<input id="mm-add" className="rounded-md border px-2 py-1 text-sm w-[220px]" placeholder="metric_name ekle…"
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							const v = (e.target as HTMLInputElement).value.trim();
							if (v) addMetric(v);
							(e.target as HTMLInputElement).value = "";
						}
					}}
				/>
				<button
					onClick={() => {
						const el = document.getElementById("mm-add") as HTMLInputElement | null;
						const v = el?.value.trim(); if (v) addMetric(v);
						if (el) el.value = "";
					}}
					className="rounded-md bg-neutral-900 text-white px-3 py-1 text-sm"
				>
					Ekle
				</button>
			</div>
		</div>
	);

	return (
		<div className="fixed bottom-4 right-4 z-50 w-[min(96vw,900px)] rounded-2xl border bg-white shadow-xl dark:bg-neutral-900 dark:text-white">
			<div className="border-b px-4 py-2 text-sm font-medium">Metrics Mini</div>
			{header}
			<div className="max-h-[50vh] overflow-auto p-3">
				<table className="w-full text-sm">
					<thead>
						<tr className="text-left opacity-70">
							<th className="py-1">Metric</th>
							<th className="py-1">Value</th>
							<th className="py-1">Trend</th>
							<th className="py-1"></th>
						</tr>
					</thead>
					<tbody>
						{rows.map((r) => (
							<tr key={r.name} className="border-t">
								<td className="py-1 font-mono">{r.name}</td>
								<td className="py-1 tabular-nums">{Number.isFinite(r.value) ? r.value : <span className="opacity-50">n/a</span>}</td>
								<td className="py-1"><Sparkline data={r.hist} /></td>
								<td className="py-1 text-right">
									<button
										onClick={() => removeMetric(r.name)}
										className="rounded-md border px-2 py-0.5 text-xs opacity-70 hover:opacity-100"
										title="Remove metric"
									>
										Sil
									</button>
								</td>
							</tr>
						))}
						{selected.filter(n => !rows.find(r => r.name === n)).map((name) => (
							<tr key={name} className="border-t opacity-60">
								<td className="py-1 font-mono">{name}</td>
								<td className="py-1">n/a</td>
								<td className="py-1"><Sparkline data={histRef.current.get(name) ?? []} /></td>
								<td className="py-1 text-right">
									<button
										onClick={() => removeMetric(name)}
										className="rounded-md border px-2 py-0.5 text-xs"
									>
										Sil
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>

				{selected.length === 0 && (
					<div className="p-4 text-sm opacity-70">
						Bu preset boş. Üstten başka preset seçin veya ölçüm adı yazarak ekleyin.
					</div>
				)}
			</div>
		</div>
	);
}

function arraysEqual(a: string[], b: string[]) {
	if (a.length !== b.length) return false;
	for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
	return true;
} 
