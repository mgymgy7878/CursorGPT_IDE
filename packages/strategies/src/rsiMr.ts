import { z } from "zod";
import type { Strategy } from "./types";

export const RSIParams = z.object({ 
  period: z.number().int().min(2).default(14), 
  buy: z.number().min(1).max(50).default(30), 
  sell: z.number().min(50).max(99).default(70) 
});
export type RSIParams = z.infer<typeof RSIParams>;

export const rsiMr: Strategy<RSIParams> = {
	id:'rsi-mr', name:'RSI Mean Reversion', version:'0.1.0',
	paramSchema: RSIParams as z.ZodSchema<RSIParams>,
	async run(){ return { pnl: Math.random()*2-1, sharpe: Math.random()*2, winRate: 0.4+Math.random()*0.4, maxDD: Math.random()*0.2, trades: 15+Math.floor(Math.random()*30) }; }
}; 