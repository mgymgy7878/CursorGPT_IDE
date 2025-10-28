export const TRADE_MODE = (process.env.TRADE_MODE ?? "paper") as "paper" | "live" | "testnet";
export const wsManager = { 
  publish() { /* no-op */ }, 
  subscribe() { /* no-op */ },
  isConnectedToWebSocket() { return false; },
  connect() { return Promise.resolve(); },
  on() { /* no-op */ }
};
export const riskManager = { 
  check() { return { ok: true }; },
  rules: [],
  addRule() { /* no-op */ }
};
export const pnlTracker = { 
  mark() { /* no-op */ }, 
  summary() { return { pnl: 0 }; },
  updatePnL() { /* no-op */ },
  getPnL() { return { realizedPnL: 0, unrealizedPnL: 0, totalPnL: 0 }; }
};

export function genClientOrderId(idem?: string) {
  if (idem) return idem.slice(0, 36);
  return `spark-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
} 