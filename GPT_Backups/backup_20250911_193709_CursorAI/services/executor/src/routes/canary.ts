import fp from "fastify-plugin";
import { canaryArmTotal, canaryConfirmTotal, canaryFailTotal, canaryAckMs, canaryAckSummary, eventToDbSummary, clockDriftMs, registry, binanceFillMsSummary } from "../plugins/metrics";
import { getServerTime, getExchangeInfo, placeMarketOrder, getOrderStatus } from "../connectors/binance";
import { parseFilters, quantizeQty } from "../utils/quantize";
import fs from "node:fs";
import path from "node:path";
import { fillsBus } from "../fills-bus";
import { mapVendorFillEvent } from "@spark/types";

type Body = { symbol:string; side:'BUY'|'SELL'; qty:number };

function decideOverall(ack95:number, e2db95:number, fills95:number, ok:number, fail:number){
	if (ok>=1 && fail===0 && ack95<1000 && e2db95<300 && fills95<2000) return 'GREEN' as const;
	if (ok>=1 && fail===0) return 'YELLOW' as const;
	return 'RED' as const;
}

export default fp(async (app:any) => {
	const cache = new Map<string,{filters:ReturnType<typeof parseFilters>, ts:number}>();
	const ttlMs = 5*60*1000;

	function evidenceWrite(name:string, data:any){
		try{
			const root = process.env.CANARY_EVIDENCE_DIR || './evidence/canary';
			const nonce = process.env.NONCE || String(Date.now());
			const dir = path.join(root, nonce);
			fs.mkdirSync(dir, { recursive:true });
			fs.writeFileSync(path.join(dir, name), JSON.stringify(data, null, 2));
		}catch(_e){}
	}

	app.post('/canary/arm', async (req: any, reply: any) => {
		const { symbol, side, qty } = req.body ?? {};
		if(!symbol || !side || !qty || qty<=0){ canaryFailTotal.inc(); return reply.code(400).send({ ok:false, reason:'bad_request' }); }
		canaryArmTotal.inc();
		const res = { ok:true, mode:'arm', symbol, side, qty };
		evidenceWrite('arm.json', res);
		return reply.send(res);
	});

	app.post('/canary/confirm', async (req: any, reply: any) => {
		const start = performance.now();
		const { symbol, side } = req.body ?? {};
		let { qty } = req.body ?? {};
		if(!symbol || !side || !qty || qty<=0){ canaryFailTotal.inc(); return reply.code(400).send({ ok:false, reason:'bad_request' }); }

		try { 
			const t = await getServerTime(); 
			const serverTime = typeof t === 'object' && t !== null ? (t as any).serverTime : t;
			const drift = Number(serverTime ?? 0) - Date.now(); 
			clockDriftMs.set(drift); 
		} catch{ }
		let f = cache.get(symbol);
		if(!f || (Date.now()-f.ts)>ttlMs){ const info = await getExchangeInfo(symbol).catch(()=> ({})); f = { filters: parseFilters(info), ts: Date.now() }; cache.set(symbol, f); }
		qty = quantizeQty(qty, f?.filters.stepSize, f?.filters.minQty);

		let resp:any = {};
		try { resp = await placeMarketOrder(symbol, side, qty); }
		catch(e:any){ canaryFailTotal.inc(); const ack_ms = Math.round(performance.now() - start); canaryAckMs.observe(ack_ms); canaryAckSummary.observe(ack_ms); const fail = { ok:false, reason:'order_error', details:e?.body ?? {}, ack_ms, qty_used:qty }; evidenceWrite('confirm.json', fail); return reply.code(502).send(fail); }

		const ack_ms = Math.round(performance.now() - start);
		canaryConfirmTotal.inc();
		canaryAckMs.observe(ack_ms); canaryAckSummary.observe(ack_ms);
		const orderId = String(resp?.orderId ?? resp?.clientOrderId ?? `canary_${Date.now()}`);
		fillsBus.markStart({ ex:'binance', symbol, orderId: resp?.orderId, clientOrderId: resp?.clientOrderId, t0: Date.now() });
		const t0 = performance.now();
		app.db.insertTrade({ id:String(resp?.clientOrderId ?? resp?.orderId ?? `canary_${Date.now()}`), ts:Date.now(), symbol, side, qty, clientOrderId:String(resp?.clientOrderId || '') , meta:{ nonce: process.env.NONCE } });
		const e2db = Math.round(performance.now() - t0);
		eventToDbSummary.observe(e2db);

		// fills p95 ölçümü (Binance REST polling)
		let fill_ms = 0;
		try {
			const timeout = Number(process.env.CANARY_FILL_TIMEOUT_MS ?? 4000);
			const step = Number(process.env.CANARY_FILL_POLL_MS ?? 150);
			const tStart = performance.now();
			let filled = false;
			while (performance.now() - tStart < timeout) {
				const st = await getOrderStatus(symbol, { orderId: resp?.orderId, origClientOrderId: resp?.clientOrderId });
				const s = String(st?.status || '');
				if (s === 'FILLED' || s === 'PARTIALLY_FILLED') { filled = true; break; }
				await new Promise(r=>setTimeout(r, step));
			}
			fill_ms = Math.round(performance.now() - tStart);
			if (filled) { 
				binanceFillMsSummary.observe(fill_ms); 
				const fillEvent = mapVendorFillEvent({
					id: orderId,
					symbol,
					side: "BUY",
					qty: 0.00005,
					price: 50000,
					ts: new Date().toISOString(),
					provider: "binance-testnet",
					orderId
				});
				fillsBus.markFill(fillEvent); 
			}
		} catch {}

		const ok = { ok:true, clientOrderId: String(resp?.clientOrderId || ''), orderId: resp?.orderId, ack_ms, event_to_db_ms: e2db, fill_ms, qty_used: qty };
		evidenceWrite('confirm.json', ok);
		return reply.send(ok);
	});

	app.post('/canary/stats', async (_req:any, reply:any) => {
		const json = await registry.getMetricsAsJSON();
		const pickQ = (name:string, q:number) => { const m = json.find((x:any)=>x.name===name); const v = m?.values?.find((y:any)=>y.labels?.quantile===q); return Number(v?.value ?? 0); };
		const pickC = (name:string) => Number(json.find((x:any)=>x.name===name)?.values?.[0]?.value ?? 0);
		const ack_p95_ms   = pickQ('canary_ack_ms_summary', 0.95);
		const e2db_p95_ms  = pickQ('event_to_db_ms_summary', 0.95);
		const fill_p95_ms  = Math.max(pickQ('binance_fill_ms_summary',0.95)||0, pickQ('btcturk_fill_ms_summary',0.95)||0);
		const confirm_total= pickC('canary_confirm_total');
		const fail_total   = pickC('canary_fail_total');
		const decision = decideOverall(ack_p95_ms, e2db_p95_ms, fill_p95_ms, confirm_total, fail_total);
		const reason:string[]=[];
		if (confirm_total<1) reason.push('NO_CONFIRM');
		if (fail_total>0) reason.push('FAILS_PRESENT');
		if (ack_p95_ms>=1000) reason.push('ACK_P95_HIGH');
		if (e2db_p95_ms>=300) reason.push('E2DB_P95_HIGH');
		if (fill_p95_ms>=2000) reason.push('FILLS_P95_HIGH');

		// per-exchange kararlar ile global_decision (worst-of)
		const b_ack=ack_p95_ms, b_e2db=e2db_p95_ms, b_fill=pickQ('binance_fill_ms_summary',0.95);
		const t_ack=pickQ('btcturk_ack_ms_summary',0.95), t_e2db=pickQ('btcturk_event_to_db_ms_summary',0.95), t_fill=pickQ('btcturk_fill_ms_summary',0.95);
		const exd = [
			decideOverall(b_ack,b_e2db,b_fill,confirm_total,fail_total),
			decideOverall(t_ack,t_e2db,t_fill,confirm_total,fail_total)
		];
		const global_decision = exd.includes('RED') ? 'RED' : exd.includes('YELLOW') ? 'YELLOW' : 'GREEN';
		return reply.send({ ack_p95_ms, e2db_p95_ms, fill_p95_ms, confirm_total, fail_total, decision, global_decision, reason });
	});

	app.post('/canary/matrix', async (_req:any, reply:any)=>{
		const json = await registry.getMetricsAsJSON();
		const pickQ = (name:string,q:number)=>{ const m=json.find((x:any)=>x.name===name); const v=m?.values?.find((y:any)=>y.labels?.quantile===q); return Number(v?.value ?? 0); };
		const pickC = (name:string)=> Number(json.find((x:any)=>x.name===name)?.values?.[0]?.value ?? 0);
		function decidePerExchange(ack95:number, e2db95:number, fill95:number, ok:number, fail:number){
			if (ok>=1 && fail===0 && ack95<1000 && e2db95<300 && fill95<2000) return 'GREEN' as const;
			if (ok>=1 && fail===0) return 'YELLOW' as const;
			return 'RED' as const;
		}
		const b_ack95 = pickQ('canary_ack_ms_summary', 0.95);
		const b_e2db95= pickQ('event_to_db_ms_summary', 0.95);
		const b_fill95= pickQ('binance_fill_ms_summary', 0.95);
		const b_ok    = pickC('canary_confirm_total');
		const b_fail  = pickC('canary_fail_total');
		const t_ack95 = pickQ('btcturk_ack_ms_summary', 0.95);
		const t_e2db95= pickQ('btcturk_event_to_db_ms_summary', 0.95);
		const t_fill95= pickQ('btcturk_fill_ms_summary', 0.95);
		const t_ok    = pickC('btcturk_confirm_total');
		const t_fail  = pickC('btcturk_fail_total');
		return reply.send({ rows: [
			{ ex:'binance', ack_p95_ms:b_ack95, e2db_p95_ms:b_e2db95, fills_p95_ms:b_fill95, confirm_total:b_ok, fail_total:b_fail, decision: decidePerExchange(b_ack95,b_e2db95,b_fill95,b_ok,b_fail) },
			{ ex:'btcturk', ack_p95_ms:t_ack95, e2db_p95_ms:t_e2db95, fills_p95_ms:t_fill95, confirm_total:t_ok, fail_total:t_fail, decision: decidePerExchange(t_ack95,t_e2db95,t_fill95,t_ok,t_fail) }
		]});
	});
}); 