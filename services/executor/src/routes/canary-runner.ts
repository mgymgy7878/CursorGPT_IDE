import fp from "fastify-plugin";
// use HTTP injection to call existing /canary/confirm instead of importing internals

export default fp(async (app:any)=>{
	app.post('/canary/run', async (req:any, reply:any)=>{
		const n = Math.max(1, Math.min( Number(req?.body?.n ?? 5), 20 ));
		const payload = { symbol: String(req?.body?.symbol ?? 'BTCUSDT'), side: String(req?.body?.side ?? 'BUY').toUpperCase(), qty: Number(req?.body?.qty ?? 0.0002) } as any;
		const out:any[] = [];
		for (let i=0;i<n;i++){
			try {
				const res = await app.inject({ method:'POST', url:'/canary/confirm', payload });
				out.push(res.json());
			}
			catch(e:any){ out.push({ ok:false, reason:'confirm_error', details:e?.message }); }
			await new Promise(r=>setTimeout(r, 150));
		}
		return reply.send({ ok:true, n, results: out });
	});
}); 