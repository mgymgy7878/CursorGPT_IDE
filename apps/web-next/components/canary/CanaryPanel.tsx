'use client';
import { useEffect, useState } from "react";

type Stats = { ack_p95_ms?:number; e2db_p95_ms?:number; confirm_total?:number; fail_total?:number; clock_drift_ms?:number; decision?:'GREEN'|'YELLOW'|'RED'; reason?:string|null };
type Resp = { ok?:boolean; clientOrderId?:string; ack_ms?:number; event_to_db_ms?:number; reason?:string; qty_used?:number } | any;

function Badge({d}:{d:Stats['decision']}) {
	const color = d==='GREEN' ? 'bg-emerald-500' : d==='YELLOW' ? 'bg-amber-500' : 'bg-rose-500';
	return <span className={`px-2 py-0.5 rounded text-white text-xs ${color}`}>{d ?? '—'}</span>;
}

export default function CanaryPanel(){
	const [loading,setLoading]=useState(false);
	const [last,setLast]=useState<Resp>({});
	const [stats,setStats]=useState<Stats>({});
	const [btInfo,setBtInfo]=useState<{envOK?:boolean; live?:boolean}|null>(null);

	async function refreshStats(){
		const r=await fetch(`/api/public/canary/stats`,{method:'POST'}).catch(()=>null);
		const j=await r?.json().catch(()=>({}));
		setStats(j||{});
	}

	async function call(ep:'arm'|'confirm'){
		setLoading(true);
		try {
			const r=await fetch(`/api/public/canary/${ep}`,{
				method:'POST',headers:{'Content-Type':'application/json'},
				body:JSON.stringify({symbol:'BTCUSDT',side:'BUY',qty:0.0002})
			}).catch(()=>null);
			const j=await r?.json().catch(()=>({ok:false,reason:'parse_error'}));
			setLast(j||{ok:false});
		} finally {
			setLoading(false);
			await refreshStats();
		}
	}

	useEffect(()=>{ refreshStats(); }, []);
	useEffect(()=>{ (async()=>{ const r=await fetch('/api/public/btcturk/smoke',{method:'POST'}).catch(()=>null); setBtInfo(await r?.json().catch(()=>null)); })(); },[]);

	return (
		<div className="p-4 space-y-4">
			<div className="flex flex-wrap items-center gap-4 text-sm">
				<div>Decision: <Badge d={stats.decision}/></div>
				<div>ACK P95: <b>{stats.ack_p95_ms ?? 0} ms</b> <span className="opacity-60">(target &lt; 1000)</span></div>
				<div>Event→DB P95: <b>{stats.e2db_p95_ms ?? 0} ms</b> <span className="opacity-60">(target &lt; 300)</span></div>
				<div>Confirm: <b>{stats.confirm_total ?? 0}</b></div>
				<div>Fail: <b className="text-red-600">{stats.fail_total ?? 0}</b></div>
				<div>Drift: <b>{stats.clock_drift_ms ?? 0} ms</b></div>
				<button className="px-2 py-1 rounded bg-slate-200" onClick={refreshStats}>Refresh</button>
			</div>

			<div className="flex gap-2">
				<button className="px-3 py-2 rounded bg-slate-200" disabled={loading} onClick={()=>call('arm')}>ARM</button>
				<button className="px-3 py-2 rounded bg-slate-200" disabled={loading} onClick={()=>call('confirm')}>CONFIRM</button>
				<button className="px-3 py-2 rounded bg-slate-200" disabled={loading} onClick={async()=>{
					setLoading(true);
					try{
						await fetch('/api/public/canary/run',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ n:5, symbol:'BTCUSDT', side:'BUY', qty:0.0002 }) });
						await refreshStats();
					} finally { setLoading(false); }
				}}>Run ×5</button>
				{btInfo?.live ? (
					<button className="px-3 py-2 rounded bg-slate-200" disabled={loading} onClick={async()=>{
						setLoading(true);
						try{
							for (let i=0;i<3;i++){
								await fetch('/api/public/btcturk/order/market',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ pairSymbol:'BTCUSDT', side:'buy', quantity:0.0002 }) });
								await new Promise(r=>setTimeout(r,150));
							}
						} finally { setLoading(false); await refreshStats(); }
					}}>BTCTurk ×3</button>
				) : null}
				<a className="px-3 py-2 rounded bg-slate-200 inline-flex items-center" href="/api/public/canary/evidence/bundle" onClick={async()=>{ await refreshStats(); }}>Download evidence</a>
				<a className="px-3 py-2 rounded bg-slate-200 inline-flex items-center" href="/api/public/canary/evidence/report" target="_blank" rel="noreferrer">Open report</a>
			</div>

			<pre className="text-xs bg-black/5 p-2 rounded">{JSON.stringify(last,null,2)}</pre>
			{stats?.reason && <div className="text-xs text-amber-700">Reason: {stats.reason}</div>}
		</div>
	);
} 