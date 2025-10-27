export type Ticker = {
  bid: number;
  ask: number;
  last: number;
  ts?: string;
};

export async function fetchBtcturkTicker(symbol: string): Promise<Ticker> {
  const url = `/api/public/btcturk/ticker?symbol=${encodeURIComponent(symbol)}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('ticker fetch failed');
  return res.json();
}

type PollOpts = {
  symbol: string;
  intervalMs?: number;
  onData: (t: Ticker) => void;
  onError?: (e: unknown) => void;
};

export function startTickerPolling({ symbol, intervalMs = 2000, onData, onError }: PollOpts) {
  let stopped = false;

  const tick = async () => {
    try {
      const t = await fetchBtcturkTicker(symbol);
      if (!stopped) onData(t);
    } catch (e) {
      onError?.(e);
    }
  };

  const id = setInterval(tick, intervalMs);
  tick();
  return () => { stopped = true; clearInterval(id); };
}
