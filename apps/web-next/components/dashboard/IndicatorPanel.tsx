'use client';

import MiniSparkline from "@/components/common/MiniSparkline";

export function rsi(values: number[], period = 14): number[] {
  const out: number[] = [];
  let gain = 0, loss = 0;
  for (let i = 1; i < values.length; i++) {
    const ch = values[i] - values[i - 1];
    if (i <= period) {
      if (ch > 0) gain += ch; else loss -= ch;
      out.push(NaN);
      continue;
    }
    if (i === period + 1) {
      gain /= period;
      loss /= period;
    } else {
      const g = ch > 0 ? ch : 0;
      const l = ch < 0 ? -ch : 0;
      gain = (gain * (period - 1) + g) / period;
      loss = (loss * (period - 1) + l) / period;
    }
    const rs = loss === 0 ? 100 : 100 * gain / (gain + loss);
    out.push(rs);
  }
  return out;
}

function ema(prev: number | undefined, price: number, k: number): number {
  return prev == null ? price : (price - prev) * k + prev;
}
export function macd(values: number[], fast = 12, slow = 26, signal = 9) {
  const kf = 2 / (fast + 1), ks = 2 / (slow + 1), ksx = 2 / (signal + 1);
  const macd: number[] = [], signalArr: number[] = [], hist: number[] = [];
  let ef: number | undefined, es: number | undefined, sig: number | undefined;
  for (const v of values) {
    ef = ema(ef, v, kf);
    es = ema(es, v, ks);
    const m = (ef as number) - (es as number);
    macd.push(m);
    sig = ema(sig, m, ksx);
    signalArr.push(sig as number);
    hist.push(m - (sig as number));
  }
  return { macd, signal: signalArr, hist };
}

export default function IndicatorPanel({
  priceSeries,
  showRSI,
  showMACD,
}: {
  priceSeries: Array<{ value: number }>;
  showRSI: boolean;
  showMACD: boolean;
}) {
  const closes = priceSeries.map(p => p.value);
  const rsiSeries = showRSI ? rsi(closes).slice(-200).filter(Number.isFinite) as number[] : [];
  const macdAll = showMACD ? macd(closes) : null;
  const macdSeries = showMACD ? macdAll!.macd.slice(-200) : [];
  const macdTitle = macdAll
    ? (() => {
        const n = macdAll.macd.length - 1;
        const last = macdAll.macd[n], sig = macdAll.signal[n], h = macdAll.hist[n];
        const fmt = (x: number) => (Math.abs(x) >= 100 ? x.toFixed(0) : x.toFixed(2));
        return `MACD:${fmt(last)} | Signal:${fmt(sig)} | Hist:${fmt(h)}`;
      })()
    : undefined;

  return (
    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
      {showRSI ? (
        <div className="rounded-xl border border-zinc-800 p-2">
          <div className="text-[10px] text-zinc-400 mb-1">RSI (14)</div>
          <MiniSparkline values={rsiSeries} titleText={rsiSeries.length ? `RSI last:${rsiSeries[rsiSeries.length-1].toFixed(1)}` : undefined} />
        </div>
      ) : null}
      {showMACD ? (
        <div className="rounded-xl border border-zinc-800 p-2">
          <div className="text-[10px] text-zinc-400 mb-1">MACD (12/26/9)</div>
          <MiniSparkline values={macdSeries} titleText={macdTitle} />
        </div>
      ) : null}
    </div>
  );
} 