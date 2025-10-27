import type { Strategy, StrategyCtx, Bar } from "../engine.js";

const SMA = (arr: number[], n: number) => arr.slice(-n).reduce((a, b) => a + b, 0) / n;

export default function smaCross(fast = 10, slow = 20): Strategy {
  const closes: number[] = [];
  return {
    onBar(bar: Bar, ctx: StrategyCtx) {
      closes.push(bar.c);
      if (closes.length < slow) return;
      const f = SMA(closes, fast), s = SMA(closes, slow);
      const hasPos = (ctx.broker.pos ?? 0) > 0;
      if (f > s && !hasPos) ctx.broker.submit({ ts: bar.ts, side: "buy", qty: 1, type: "mkt" });
      if (f < s && hasPos) ctx.broker.submit({ ts: bar.ts, side: "sell", qty: 1, type: "mkt" });
    }
  };
}
