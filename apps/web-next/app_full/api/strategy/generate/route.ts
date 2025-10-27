export async function POST(req: Request) {
	const body = await req.json().catch(() => ({} as any));
	const name = String(body?.name || 'TrendFollower')
	const dsl = `name: ${name}\nparams:\n  fast: { min: 5, max: 50, step: 5 }\n  slow: { min: 50, max: 200, step: 10 }\nlogic:\n  entry:\n    long: cross(ma(close, fast), ma(close, slow))\n    short: cross(ma(close, slow), ma(close, fast))\n  exit:\n    long: crossDown(ma(close, fast), ma(close, slow))\n    short: crossDown(ma(close, slow), ma(close, fast))\nrisk:\n  sl: atr(14) * 2.5\n  tp: atr(14) * 4\n`;
	const ts = `export interface Candle{c:number} \nexport const ${name} = { name: '${name}', version: '1.0.0', signal({candles, params}:{candles:Candle[], params:any}){ const fast=Number(params.fast||20), slow=Number(params.slow||100); const closes=candles.map(c=>c.c); const ma=(arr:number[],n:number)=>arr.slice(-n).reduce((a,b)=>a+b,0)/n; const f=ma(closes,fast), s=ma(closes,slow); const pf=ma(closes.slice(0,-1),fast), ps=ma(closes.slice(0,-1),slow); if (pf<=ps && f>s) return 'LONG'; if (pf>=ps && f<s) return 'SHORT'; return 'NONE'; } }`;
	return Response.json({ dsl, ts });
} 
