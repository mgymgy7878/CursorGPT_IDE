export type Candle = { 
  t: number;  // timestamp (ms)
  o: number;  // open
  h: number;  // high
  l: number;  // low
  c: number;  // close
  v: number;  // volume
};

export type Trade = { 
  id: string; 
  side: "long" | "short"; 
  entry: number; 
  exit?: number; 
  pnl?: number; 
  tsEnter: number; 
  tsExit?: number;
};

export type Report = { 
  pnl: number; 
  trades: Trade[]; 
  stats: Record<string, number>;
};

export type Order = { 
  side: "buy" | "sell"; 
  qty: number; 
  price?: number; 
  ts: number;
};

export type StrategyCtx = { 
  candles: Candle[]; 
  emit: (order: Order) => void; 
  now: () => number;
};

export type Strategy = (
  params: Record<string, number | string>, 
  ctx: StrategyCtx
) => Promise<void> | void;

export type RunOpts = {
  symbol: string;
  tf: string;
  candles: Candle[];
  strategy: Strategy;
  params: Record<string, any>;
  id?: string;
};

