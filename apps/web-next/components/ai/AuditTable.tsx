"use client";
import { useEffect, useMemo, useState } from "react";

type Row = { ts?: string; actor?: string; action?: string; status?: string; nonce?: string; reason?: string; [k:string]: any };

export default function AuditTable() {
	const [rows, setRows] = useState<Row[]>([]);
	const [n, setN] = useState(50);
	const [actor, setActor] = useState("");
	const [action, setAction] = useState("");
	const [status, setStatus] = useState("");
	const [from, setFrom] = useState("");
	const [to, setTo] = useState("");
	const [bucket, setBucket] = useState<"1h"|"6h"|"1d">("6h");

	const [sortKey, setSortKey] = useState<"ts"|"actor"|"action"|"status">("ts");
	const [sortDir, setSortDir] = useState<"asc"|"desc">("desc");

	useEffect(() => {
		const qs = `/audit.tail n=${n} --json` + (from?` from=${from}`:"") + (to?` to=${to}`:"");
		const es = new EventSource(`/api/public/ai/chat?prompt=${encodeURIComponent(qs)}`);
		const onJson = (ev: MessageEvent) => { try { const data = JSON.parse((ev as any).data); if (Array.isArray(data)) setRows(data); } catch {} };
		es.addEventListener("json", onJson as any);
		return () => { try { es.close(); } catch {} };
	}, [n, from, to]);

	useEffect(() => {
		const now = new Date();
		const toISO = (d: Date)=> d.toISOString().slice(0,16);
		const end = toISO(now);
		const start = new Date(now);
		if (bucket==="1h") start.setHours(now.getHours()-1);
		if (bucket==="6h") start.setHours(now.getHours()-6);
		if (bucket==="1d") start.setDate(now.getDate()-1);
		setTo(end);
		setFrom(toISO(start));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [bucket]);

	const filtered = useMemo(() => {
		return rows.filter(r => {
			const okActor = actor ? (String(r.actor||"").includes(actor)) : true;
			const okAction = action ? (String(r.action||"").includes(action)) : true;
			const okStatus = status ? (String(r.status||"").includes(status)) : true;
			const t = r.ts ? new Date(r.ts).getTime() : undefined;
			const fromMs = from ? new Date(from).getTime() : undefined;
			const toMs = to ? new Date(to).getTime() : undefined;
			const okTime = t ? ((fromMs? t>=fromMs : true) && (toMs? t<=toMs : true)) : true;
			return okActor && okAction && okStatus && okTime;
		});
	}, [rows, actor, action, status, from, to]);

	const sorted = useMemo(()=>{
		const arr = [...filtered];
		arr.sort((a,b)=>{
			const va = (a as any)[sortKey] ?? ""; const vb = (b as any)[sortKey] ?? "";
			return (String(va)).localeCompare(String(vb)) * (sortDir==='asc'?1:-1);
		});
		return arr;
	},[filtered, sortKey, sortDir]);

	function toCSV(list: Row[]){
		const cols = ["ts","actor","action","status","nonce","reason"];
		const header = cols.join(",");
		const lines = list.map(r=>cols.map(c=>JSON.stringify((r as any)[c] ?? "")).join(",")).join("\n");
		return header+"\n"+lines;
	}
	function downloadCSV(){
		const blob = new Blob([toCSV(sorted)], {type:'text/csv'});
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a'); a.href=url; a.download=`audit_${Date.now()}.csv`; a.click();
		URL.revokeObjectURL(url);
	}

	const th = (k:"ts"|"actor"|"action"|"status") => (
		<button className="flex items-center gap-1" onClick={()=>{ setSortKey(k); setSortDir(d=> d==="asc"?"desc":"asc"); }}>
			{k} {sortKey===k ? (sortDir==="asc"?"▲":"▼") : ""}
		</button>
	);

	const chip = (s: string) => {
		const tone = s.includes("APPLIED")?"ok":s.includes("PENDING")?"warn":s.includes("ERROR")?"err":"muted";
		const cls = "text-[11px] px-2 py-0.5 rounded-full border "+(
			tone==="ok"?"bg-emerald-50 border-emerald-200 text-emerald-700":
			tone==="warn"?"bg-amber-50 border-amber-200 text-amber-700":
			tone==="err"?"bg-rose-50 border-rose-200 text-rose-700":"bg-neutral-50 border-neutral-200 text-neutral-600");
		return <span className={cls}>{s}</span>;
	};

	return (
		<div className="p-3 rounded-2xl border bg-white shadow-sm space-y-2">
			<div className="flex items-center justify-between">
				<div className="font-semibold">Audit Kayıtları</div>
				<div className="flex items-center gap-2">
					<label className="text-xs">n</label>
					<input type="number" className="border rounded px-2 py-1 w-20" value={n} onChange={e=>setN(Math.max(10, Math.min(1000, Number(e.target.value))))}/>
					<select className="border rounded px-2 py-1" value={bucket} onChange={e=>setBucket(e.target.value as any)}>
						<option value="1h">1h</option><option value="6h">6h</option><option value="1d">1d</option>
					</select>
					<button onClick={downloadCSV} className="text-xs px-2 py-1 border rounded hover:bg-neutral-50">CSV indir</button>
					<button onClick={()=>{ setActor(""); setAction(""); setStatus(""); setFrom(""); setTo(""); }} className="text-xs px-2 py-1 border rounded hover:bg-neutral-50">Clear filters</button>
				</div>
			</div>
			<div className="grid grid-cols-5 gap-2 text-xs">
				<input className="border rounded px-2 py-1" placeholder="actor" value={actor} onChange={e=>setActor(e.target.value)} />
				<input className="border rounded px-2 py-1" placeholder="action" value={action} onChange={e=>setAction(e.target.value)} />
				<input className="border rounded px-2 py-1" placeholder="status" value={status} onChange={e=>setStatus(e.target.value)} />
				<input className="border rounded px-2 py-1" type="datetime-local" value={from} onChange={e=>setFrom(e.target.value)} />
				<input className="border rounded px-2 py-1" type="datetime-local" value={to} onChange={e=>setTo(e.target.value)} />
			</div>
			<div className="overflow-auto max-h-96 border rounded">
				<table className="w-full text-xs">
					<thead className="bg-neutral-50 sticky top-0">
						<tr>
							<th className="text-left p-2">{th("ts")}</th>
							<th className="text-left p-2">{th("actor")}</th>
							<th className="text-left p-2">{th("action")}</th>
							<th className="text-left p-2">{th("status")}</th>
							<th className="text-left p-2">nonce</th>
							<th className="text-left p-2">reason</th>
							<th className="text-left p-2">ops</th>
						</tr>
					</thead>
					<tbody>
						{sorted.map((r, i)=>(
							<tr key={i} className="odd:bg-white even:bg-neutral-50/40">
								<td className="p-2 whitespace-nowrap">{r.ts || r.time || "-"}</td>
								<td className="p-2">{r.actor || "-"}</td>
								<td className="p-2">{r.action || "-"}</td>
								<td className="p-2">{chip(String((r.status || r.result || "-") as any).toUpperCase())}</td>
								<td className="p-2">{r.nonce || "-"}</td>
								<td className="p-2">{r.reason || "-"}</td>
								<td className="p-2">
									<button onClick={()=> navigator.clipboard.writeText(JSON.stringify(r,null,2))} className="text-[11px] px-2 py-0.5 border rounded hover:bg-neutral-50">Copy JSON</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
} 