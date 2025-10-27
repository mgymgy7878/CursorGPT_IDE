import { Strategy, StrategyCtx, Order } from "../types";

function sma(arr: number[], win: number): number[] {
  const out: number[] = [];
  let sum = 0;
  for (let i = 0; i < arr.length; i++) {
    sum += arr[i];
    if (i >= win) sum -= arr[i - win];
    if (i >= win - 1) out.push(sum / win);
  }
  return out;
}

export const smaCross: Strategy = async (params, ctx: StrategyCtx) => {
  const fast = Number(params.fast ?? 10);
  const slow = Number(params.slow ?? 30);
  const closes = ctx.candles.map(c => c.c);
  const tms = ctx.candles.map(c => c.t);
  const f = sma(closes, fast);
  const s = sma(closes, slow);
  const offs = slow - 1; // align
  let prev = 0;
  const emit = (o: Order) => ctx.emit(o);

  for (let i = 1; i < s.length; i++) {
    const fi = f[i + (fast - slow)];
    const si = s[i];
    const cur = fi - si;
    const ts = tms[i + offs];

    // cross up
    if (prev <= 0 && cur > 0) {
      emit({ side: "buy", qty: 1, ts });
    }
    // cross down
    if (prev >= 0 && cur < 0) {
      emit({ side: "sell", qty: 1, ts });
    }
    prev = cur;
  }
};

