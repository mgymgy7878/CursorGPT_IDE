import fp from "fastify-plugin";
import { fillsBus, type FillStart, type FillEvent } from "../fills-bus";
import { Summary } from "prom-client";
import { isFillEvent } from "@spark/types";

export const fillsWsLatencySummary = new Summary({
	name:'fills_ws_ms_summary',
	help:'ACK→FILL latency via WS (ms)',
	percentiles:[0.5,0.9,0.95,0.99]
});

export default fp(async (_app:any)=>{
	const pending = new Map<string, FillStart>();
	function k(s?:Partial<FillStart|FillEvent>){
		const ex = (s as any)?.ex ?? 'unknown';
		const oid = String((s as any)?.orderId ?? '');
		const coid= String((s as any)?.clientOrderId ?? '');
		return `${ex}|${oid}|${coid}`;
	}
	fillsBus.on('start',(s:FillStart)=>{ pending.set(k(s), s); });
	fillsBus.on('fill',async (f:FillEvent)=>{
		if (!isFillEvent(f)) return;
		
		const key = k(f);
		const s = pending.get(key);
		if (!s) return;
		
		const qty = Number(f.qty);
		const price = Number(f.price);
		if (!Number.isFinite(qty) || !Number.isFinite(price)) return;
		
		const notional = qty * price;
		if (!Number.isFinite(notional)) return;
		
		const ms = Math.max(0, Math.round((f.ts ? new Date(f.ts).getTime() : Date.now()) - (s.t0 || Date.now())));
		fillsWsLatencySummary.observe(ms);
		try {
			const metrics = await import('../plugins/metrics.js');
			if (s.ex==='binance') metrics.binanceFillMsSummary.observe(ms);
			else if (s.ex==='btcturk') metrics.btcturkFillMsSummary.observe(ms);
		} catch {}
		pending.delete(key);
	});
	setInterval(()=>{ const now=Date.now(); for (const [key,s] of pending) if (now - s.t0 > 60_000) pending.delete(key); }, 10_000).unref?.();
}); 