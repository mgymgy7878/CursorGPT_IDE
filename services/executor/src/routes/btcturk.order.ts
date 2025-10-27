import fp from "fastify-plugin";
import { getServerTime, getExchangeInfo, submitOrder, btcturkGetSingleOrder, btcturkGetUserTrades } from "../connectors/btcturk.js";
import { pickPair, qQty } from "../utils/btcturkQuant.js";
import { btcturkAckSummary, btcturkConfirmTotal, btcturkFailTotal, btcturkClockDriftMs, btcturkEventToDbSummary, btcturkFillMsSummary } from "../plugins/metrics.js";
import { fillsBus } from "../fills-bus.js";
import { mapVendorFillEvent } from "@spark/types";

type Body = { pairSymbol:string; side:'buy'|'sell'; quantity:number };

export default fp(async (app:any)=>{
	app.post('/btcturk/order/market', async (req: any, reply: any)=>{
		const { pairSymbol, side } = req.body ?? {}; let { quantity } = req.body ?? {};
		if(!pairSymbol || !side || !quantity || quantity<=0) { btcturkFailTotal.inc(); return reply.code(400).send({ ok:false, reason:'bad_request' }); }
		try {
			const st = await getServerTime();
			const serverTime = typeof st === 'object' && st !== null ? (st as any).serverTime : st;
			const drift = Number(serverTime ?? 0) - Date.now();
			btcturkClockDriftMs.set(drift);
		} catch{}
		const info = await getExchangeInfo().catch(()=> ({}));
		const p = pickPair(info, pairSymbol);
		if(p) { quantity = qQty(quantity, p.numeratorScale); }
		if(String(process.env.BTCTURK_LIVE||'0') !== '1'){
			const ack_ms = 0;
			btcturkAckSummary.observe(ack_ms);
			return reply.code(412).send({ ok:false, dry:true, reason:'live_disabled', qty_used:quantity });
		}
		const t0 = performance.now();
		let resp:any={};
		try {
			resp = await submitOrder({
				quantity,
				price: 0,
				newOrderClientId: `spark_${Date.now()}`,
				orderMethod:'market', orderType: side, pairSymbol
			});
		} catch(e:any){
			btcturkFailTotal.inc();
			const ack_ms = Math.round(performance.now() - t0);
			btcturkAckSummary.observe(ack_ms);
			return reply.code(502).send({ ok:false, reason:'order_error', details:e?.body ?? {}, ack_ms, qty_used:quantity });
		}
		const ack_ms = Math.round(performance.now() - t0);
		btcturkConfirmTotal.inc();
		btcturkAckSummary.observe(ack_ms);
		const orderId = String(resp?.data?.id ?? `btcturk_${Date.now()}`);
		fillsBus.markStart({ ex:'btcturk', symbol: pairSymbol, orderId, t0: Date.now() });

		// DB-lite log + event→db
		const tdb0 = performance.now();
		app.db.insertTrade({ id:orderId, ts:Date.now(), symbol:pairSymbol, side: side.toUpperCase(), qty:quantity, meta:{ exchange:'btcturk' } });
		const e2db = Math.round(performance.now() - tdb0);
		btcturkEventToDbSummary.observe(e2db);

		// Fill ölçümü (yalnız LIVE=1 iken anlamlı)
		let fill_ms = 0;
		try {
			if (String(process.env.BTCTURK_LIVE||'0') === '1') {
				const timeout = Number(process.env.BTCTURK_FILL_TIMEOUT_MS ?? 5000);
				const step = Number(process.env.BTCTURK_FILL_POLL_MS ?? 200);
				const tStart = performance.now();
				let filled = false;
				while (performance.now() - tStart < timeout) {
					const tr = await btcturkGetUserTrades({ orderId: orderId }).catch(()=>null);
					const hasTrade = Array.isArray(tr?.data) && tr.data.length > 0;
					if (hasTrade) { filled = true; break; }
					const so = await btcturkGetSingleOrder(orderId).catch(()=>null);
					const status = String(so?.data?.status || so?.status || '');
					if (status.toUpperCase().includes('FILLED') || status.toUpperCase().includes('PARTIAL')) { filled = true; break; }
					await new Promise(r=>setTimeout(r, step));
				}
				fill_ms = Math.round(performance.now() - tStart);
				if (filled) { 
					btcturkFillMsSummary.observe(fill_ms); 
					const fillEvent = mapVendorFillEvent({
						id: orderId,
						symbol: pairSymbol,
						side: side.toUpperCase(),
						qty: quantity,
						price: 50000,
						ts: new Date().toISOString(),
						provider: "btcturk",
						orderId
					});
					fillsBus.markFill(fillEvent); 
				}
			}
		} catch {}

		return reply.send({ ok:true, orderId, ack_ms, event_to_db_ms: e2db, fill_ms, qty_used: quantity });
	});
}); 