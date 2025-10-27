import { z } from "zod";
export type Candle = { time:number; open:number; high:number; low:number; close:number; volume?:number };
export type BacktestMetrics = { pnl:number; sharpe:number; winRate:number; maxDD:number; trades:number };
export type RunContext = { candles:Candle[]; params:any };
export type Strategy<T> = {
	id:string; name:string; version:string;
	paramSchema: z.ZodSchema<T>;
	run(ctx:RunContext & { params:T }): Promise<BacktestMetrics>;
}; 