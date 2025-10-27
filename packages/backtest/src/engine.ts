export type Bar = { ts: number; o: number; h: number; l: number; c: number; v: number };
export type OrderSide = "buy" | "sell";
export type Order = { ts: number; side: OrderSide; qty: number; type: "mkt" | "lim"; price?: number };
export type Fill = { ts: number; price: number; qty: number; fee: number };

export interface StrategyCtx {
  clock: { now: number };
  broker: { cash: number; pos: number; submit: (o: Order) => void };
  metrics: { mark: (k: string, v: number) => void };
  state: Record<string, unknown>;
}

export interface Strategy {
  init?(ctx: StrategyCtx): void;
  onBar(bar: Bar, ctx: StrategyCtx): void;
  onEnd?(ctx: StrategyCtx): void;
}

export type EngineOpts = {
  initial: number;
  feeBps: number;
  slipBps: number;
  cashMode?: "strict" | "margin";
  maxPos?: number;
  useNextBarOpen?: boolean;
};

export function runBacktest(bars: Bar[], strat: Strategy, userOpts: EngineOpts) {
  const opts = {
    cashMode: "strict" as const,
    maxPos: Infinity,
    useNextBarOpen: true,
    ...userOpts
  };
  
  let cash = opts.initial;
  let pos = 0;
  let lastPrice = bars[0]?.c ?? 0;
  const orders: Order[] = [];
  const fills: Fill[] = [];
  const pending: Order[] = []; // For T+1 market fills
  const equityHistory: number[] = [];
  let sameBarFills = 0; // Anti look-ahead metric
  let skippedOrders = 0; // Cash constraint metric
  
  const ctx: StrategyCtx = {
    clock: { now: bars[0]?.ts ?? 0 },
    broker: { 
      cash, 
      pos, 
      submit: (o: Order) => orders.push(o) 
    },
    metrics: { mark: (k: string, v: number) => {} },
    state: {}
  };
  
  strat.init?.(ctx);
  
  for (let i = 0; i < bars.length; i++) {
    const b = bars[i];
    ctx.clock.now = b.ts;
    lastPrice = b.c;
    
    // 1) Process pending market orders from previous bar (T+1 fill)
    if (opts.useNextBarOpen && i > 0) {
      const openPrice = b.o;
      while (pending.length) {
        const o = pending.shift()!;
        const slip = (opts.slipBps / 1e4) * openPrice * (o.side === "buy" ? +1 : -1);
        const price = openPrice + slip;
        const fee = Math.abs(price * o.qty) * (opts.feeBps / 1e4);
        const notional = price * o.qty;
        
        // Cash constraint check
        if (o.side === "buy" && opts.cashMode === "strict" && cash < (notional + fee)) {
          skippedOrders++; // Track skipped orders
          continue; // Skip order - insufficient cash
        }
        if (o.side === "buy" && pos + o.qty > opts.maxPos) {
          skippedOrders++; // Track skipped orders
          continue; // Skip order - position limit
        }
        
        // Execute fill
        if (o.side === "buy") {
          cash -= notional + fee;
          pos += o.qty;
        } else {
          cash += notional - fee;
          pos -= o.qty;
        }
        fills.push({ ts: b.ts, price, qty: o.qty, fee });
      }
    }
    
    // 2) Strategy generates new orders
    strat.onBar(b, ctx);
    
    // 3) Process new orders
    while (orders.length) {
      const o = orders.shift()!;
      
      if (o.type === "mkt" && opts.useNextBarOpen) {
        // Market orders wait for next bar open
        pending.push(o);
        continue;
      }
      
      // Limit orders or immediate market fills
      let price: number;
      if (o.type === "mkt") {
        price = b.c;
      } else {
        // Simple limit logic - check if price was touched
        if (o.side === "buy" && o.price! >= b.l) {
          price = Math.min(o.price!, b.c);
        } else if (o.side === "sell" && o.price! <= b.h) {
          price = Math.max(o.price!, b.c);
        } else {
          continue; // Limit not touched
        }
      }
      
      const slip = (opts.slipBps / 1e4) * price * (o.side === "buy" ? +1 : -1);
      const fillPrice = price + slip;
      const fee = Math.abs(fillPrice * o.qty) * (opts.feeBps / 1e4);
      const notional = fillPrice * o.qty;
      
      // Cash constraint check
      if (o.side === "buy" && opts.cashMode === "strict" && cash < (notional + fee)) {
        skippedOrders++; // Track skipped orders
        continue; // Skip order - insufficient cash
      }
      if (o.side === "buy" && pos + o.qty > opts.maxPos) {
        skippedOrders++; // Track skipped orders
        continue; // Skip order - position limit
      }
      
      // Track same-bar fills (anti look-ahead metric)
      if (o.type === "mkt") {
        sameBarFills++;
      }
      
      // Execute fill
      if (o.side === "buy") {
        cash -= notional + fee;
        pos += o.qty;
      } else {
        cash += notional - fee;
        pos -= o.qty;
      }
      fills.push({ ts: b.ts, price: fillPrice, qty: o.qty, fee });
    }
    
    // Update equity history for metrics
    const equity = cash + pos * lastPrice;
    equityHistory.push(equity);
  }
  
  // Calculate metrics
  const equity = cash + pos * lastPrice;
  const pnl = equity - opts.initial;
  const tradeCount = fills.length;
  const turnover = fills.reduce((sum, f) => sum + Math.abs(f.price * f.qty), 0);
  const exposure = Math.abs(pos * lastPrice);
  
  // Max drawdown calculation
  let maxDD = 0;
  let peak = equityHistory[0];
  for (const e of equityHistory) {
    if (e > peak) peak = e;
    const dd = (peak - e) / peak;
    if (dd > maxDD) maxDD = dd;
  }
  
  // Sharpe ratio (simplified)
  const returns = equityHistory.slice(1).map((e, i) => (e - equityHistory[i]) / equityHistory[i]);
  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const vol = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length);
  const sharpe = vol > 0 ? avgReturn / vol : 0;
  
  // Win rate (simplified - count profitable trades)
  const profitableTrades = fills.filter((_, i) => {
    if (i + 1 >= fills.length) return false;
    const entry = fills[i];
    const exit = fills[i + 1];
    return exit.price > entry.price;
  });
  const winRate = fills.length > 0 ? profitableTrades.length / fills.length : 0;
  
  return { 
    equity, 
    cash, 
    pos, 
    pnl, 
    fills,
    tradeCount,
    turnover,
    exposure,
    maxDD,
    sharpe,
    winRate,
    equityHistory,
    sameBarFills,
    skippedOrders
  };
}