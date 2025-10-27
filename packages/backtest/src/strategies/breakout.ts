import type { Strategy, StrategyCtx, Bar } from "../engine.js";

export default function breakout(window = 20): Strategy {
  const highs: number[] = [], lows: number[] = [];
  return {
    onBar(bar: Bar, ctx: StrategyCtx) {
      highs.push(bar.h);
      lows.push(bar.l);
      if (highs.length < window) return;
      const hh = Math.max(...highs.slice(-window)), ll = Math.min(...lows.slice(-window));
      const hasPos = (ctx.broker.pos ?? 0) > 0;
      if (bar.c > hh && !hasPos) ctx.broker.submit({ ts: bar.ts, side: "buy", qty: 1, type: "mkt" });
      if (bar.c < ll && hasPos) ctx.broker.submit({ ts: bar.ts, side: "sell", qty: 1, type: "mkt" });
    }
  };
}
