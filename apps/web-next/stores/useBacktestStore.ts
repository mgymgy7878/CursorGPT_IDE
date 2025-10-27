import { create } from "zustand";
// import type { BacktestResult } from "@spark/shared";
type BacktestResult = any;
// import { postJSON } from "@spark/shared";
const postJSON = async (url: string, data: any) => {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
};

type BacktestParamsInput = {
  symbol: string;
  timeframe: string;
  start: number;     // epoch ms
  end: number;       // epoch ms
  commission?: number;
  leverage?: number;
  barCount?: number;
  direction?: 'LONG'|'SHORT'|'BOTH';
};

type State = {
  params: BacktestParamsInput;
  loading: boolean;
  result?: BacktestResult;
  error?: string;
  setParams: (p: Partial<BacktestParamsInput>) => void;
  run: (override?: Partial<BacktestParamsInput>) => Promise<void>;
  reset: () => void;
};

const monthMs = 30 * 24 * 60 * 60 * 1000;
const defaults = (): BacktestParamsInput => {
  const now = Date.now();
  return {
    symbol: 'BTCUSDT',
    timeframe: '1h',
    start: now - monthMs,
    end: now,
    commission: 0.0004,
    leverage: 1,
    barCount: 1000,
    direction: 'BOTH'
  };
};

export const useBacktestStore = create<State>((set, get) => ({
  params: defaults(),
  loading: false,
  result: undefined,
  error: undefined,
  setParams: (p) => set({ params: { ...get().params, ...p } }),
  reset: () => set({ params: defaults(), result: undefined, error: undefined }),
  run: async (override) => {
    const payload = { ...get().params, ...(override ?? {}) };
    set({ loading: true, error: undefined });
    try {
      const data = await postJSON('/api/strategy/backtest', payload) as BacktestResult;
      set({ result: data, loading: false });
    } catch (e: any) {
      set({ error: e?.message ?? 'Backtest başarısız', loading: false });
    }
  }
})); 
