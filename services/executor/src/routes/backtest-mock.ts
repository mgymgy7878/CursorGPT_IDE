import fp from "fastify-plugin";
export default fp(async (app:any)=>{
	app.post('/backtest/mock', async (req:any, reply:any)=>{
		const n = Math.max(50, Math.min(Number(req?.body?.n ?? 240), 2000));
		const intervalSec = Number(req?.body?.intervalSec ?? 60);
		const base = Number(req?.body?.base ?? 65000);
		const now = Math.floor(Date.now()/1000);
		const out:any[]=[];
		let last = base;
		for(let i=n-1;i>=0;i--){
			const t = now - i*intervalSec;
			const drift = (Math.random()-0.5)* (base*0.0015);
			const open = last; const close = Math.max(100, open + drift);
			const high = Math.max(open, close) + Math.random() * (base*0.0009);
			const low  = Math.min(open, close) - Math.random() * (base*0.0009);
			out.push({ time:t, open, high, low, close }); last = close;
		}
		return reply.send({ candles: out });
	});
}); 