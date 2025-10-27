import fp from "fastify-plugin";

export default fp(async (app:any)=>{
	let gen:any;
	try {
		// @ts-ignore - build içinde ESM yolu
		gen = (await import('@spark/data-pipeline/src/sources/synthetic.js')).generateBTCUSDT24h;
	} catch {}
	app.post('/backtest/data', async (req:any, reply:any)=>{
		const n = Number(req?.body?.n ?? 240);
		const symbol = String(req?.body?.symbol ?? 'BTCUSDT');
		const tz = String(process.env.TZ || 'Europe/Istanbul');
		if (!gen) {
			try { const r = await app.inject({ method:'POST', url:'/backtest/mock', payload:{ n, base:65000, intervalSec:60 } }); return reply.send({ ...(await r.json()), tz }); }
			catch { return reply.send({ candles: [], tz }); }
		}
		try {
			const out = await gen({ n, symbol });
			const body = out?.candles ? out : { candles: out ?? [] };
			return reply.send({ ...body, tz });
		} catch {
			return reply.send({ candles: [], tz });
		}
	});
}); 