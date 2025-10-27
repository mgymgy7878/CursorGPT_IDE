import type { Strategy, StrategyCtx, Bar } from "../engine.js";

export default function rsiContrarian(period = 14, low = 30, high = 70): Strategy {
  const closes: number[] = [];
  return {
    onBar(bar: Bar, ctx: StrategyCtx) {
      closes.push(bar.c);
      if (closes.length < period + 1) return;
      let gains = 0, losses = 0;
      for (let i = closes.length - period; i < closes.length; i++) {
        const diff = closes[i] - closes[i - 1];
        if (diff > 0) gains += diff;
        else losses -= diff;
      }
      const rs = losses === 0 ? 100 : gains / losses;
      const rsi = 100 - (100 / (1 + rs));
      const hasPos = (ctx.broker.pos ?? 0) > 0;
      if (rsi < low && !hasPos) ctx.broker.submit({ ts: bar.ts, side: "buy", qty: 1, type: "mkt" });
      if (rsi > high && hasPos) ctx.broker.submit({ ts: bar.ts, side: "sell", qty: 1, type: "mkt" });
    }
  };
}
