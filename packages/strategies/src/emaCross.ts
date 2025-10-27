import { z } from "zod";
import type { Strategy } from "./types";

export const EMAParams = z.object({ 
  fast: z.number().int().min(2).default(12), 
  slow: z.number().int().min(3).default(26) 
});
export type EMAParams = z.infer<typeof EMAParams>;

export const emaCross: Strategy<EMAParams> = {
	id:'ema-cross', name:'EMA Cross', version:'0.1.0',
	paramSchema: EMAParams as z.ZodSchema<EMAParams>,
	async run(){
		return { pnl: Math.random()*2-1, sharpe: Math.random()*2, winRate: 0.4+Math.random()*0.4, maxDD: Math.random()*0.2, trades: 20+Math.floor(Math.random()*20) };
	}
}; 