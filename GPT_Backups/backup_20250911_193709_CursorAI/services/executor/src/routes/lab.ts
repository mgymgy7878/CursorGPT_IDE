import fp from "fastify-plugin";
import { labRunTotal, labSweepTotal } from "../plugins/metrics";

const registry:Record<string,any> = {
	emaCross: { 
		id: 'ema-cross', 
		name: 'EMA Cross', 
		run: async ({ candles, params }: { candles: any[], params: any }) => {
			const ema5 = candles.slice(-5).map((c: any) => c.close);
			const ema20 = candles.slice(-20).map((c: any) => c.close);
			const ema50 = candles.slice(-50).map((c: any) => c.close);
			const ema100 = candles.slice(-100).map((c: any) => c.close);

			const ema5Avg = ema5.reduce((a: number, b: number) => a + b, 0) / ema5.length;
			const ema20Avg = ema20.reduce((a: number, b: number) => a + b, 0) / ema20.length;
			const ema50Avg = ema50.reduce((a: number, b: number) => a + b, 0) / ema50.length;
			const ema100Avg = ema100.reduce((a: number, b: number) => a + b, 0) / ema100.length;

			const signal = ema5Avg > ema20Avg && ema20Avg > ema50Avg && ema50Avg > ema100Avg;
			return { signal };
		}
	},
	rsiMr: { 
		id: 'rsi-mr', 
		name: 'RSI MR', 
		run: async ({ candles, params }: { candles: any[], params: any }) => {
			const rsi = candles.slice(-14).map((c: any) => c.close);
			const rsiAvg = rsi.reduce((a: number, b: number) => a + b, 0) / rsi.length;
			const signal = rsiAvg > 70;
			return { signal };
		}
	},
};
async function runOne(id:string, candles:any[], params:any){ const s=registry[id]; if(!s) throw new Error('unknown_strategy'); return await s.run({ candles, params }); }

export default fp(async (app:any)=>{
	app.post('/lab/strategies', async (_:any, r:any)=> r.send({ ids:Object.keys(registry) }));
	app.post('/lab/run', async (req:any, r:any)=>{
		labRunTotal.inc();
		const { strategyId='ema-cross', params={}, candles=[] } = req.body||{};
		const m = await runOne(strategyId, candles, params); return r.send({ ok:true, strategyId, metrics:m });
	});
	app.post('/lab/sweep', async (req:any, r:any)=>{
		labSweepTotal.inc();
		const { strategyId='ema-cross', grid={}, n=20 } = req.body||{};
		const s = registry[strategyId]; if(!s) return r.code(400).send({ ok:false, reason:'unknown_strategy' });
		const out:any[]=[]; for(let i=0;i<Math.min(200,Math.max(1,n));i++){ const params:any={};
			for(const k of Object.keys(grid)){ const [a,b,step]=grid[k]; const v=a+Math.round(Math.random()*((b-a)/step))*step; params[k]=v; }
			out.push({ params, metrics: await s.run({ candles:[], params }) });
		}
		r.send({ ok:true, count:out.length, results:out });
	});
}); 