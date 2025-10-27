import { randomUUID } from "crypto";
import { Candle, Report, RunOpts, Strategy, StrategyCtx, Order } from "./types";
import { runDeterministicSim } from "./sim";

export async function runBacktest(opts: RunOpts): Promise<{ id: string; report: Report }> {
  const id = opts.id ?? `bt-${Date.now()}-${randomUUID().slice(0, 8)}`;
  const orders: Order[] = [];
  const ctx: StrategyCtx = {
    candles: opts.candles,
    emit: (o: Order) => orders.push(o),
    now: () => Date.now()
  };

  await Promise.resolve(opts.strategy(opts.params, ctx));
  const { trades, pnl } = runDeterministicSim(opts.candles, orders);

  const report: Report = {
    pnl,
    trades,
    stats: {
      orders: orders.length,
      trades: trades.length
    }
  };
  
  return { id, report };
}

