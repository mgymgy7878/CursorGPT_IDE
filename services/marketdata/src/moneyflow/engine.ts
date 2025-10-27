// services/marketdata/src/moneyflow/engine.ts
// Money Flow v0: CVD, NMF, OBI calculator

import { onBISTTick, BISTTick } from '../readers/bist-eq.js';
import { bistMetrics } from '../metrics/bist.js';

interface MoneyFlowMetrics {
  cvd: number;     // Cumulative Volume Delta
  nmf: number;     // Net Money Flow
  obi: number;     // Order Book Imbalance (mock)
  vwap: number;    // Volume Weighted Average Price
  volume: number;  // Total volume
  trades: number;  // Trade count
}

// Global state per symbol
const state: Record<string, MoneyFlowMetrics> = {};

/**
 * Start Money Flow Engine v0
 * Calculates CVD, NMF, OBI from BIST tick stream
 */
export function startMoneyFlowV0(symbols: string[] = ['THYAO', 'AKBNK', 'GARAN']): { snapshot: () => Record<string, MoneyFlowMetrics> } {
  console.log('[MoneyFlow] Engine v0 started for symbols:', symbols);

  // Initialize state
  for (const symbol of symbols) {
    state[symbol] = {
      cvd: 0,
      nmf: 0,
      obi: 0,
      vwap: 0,
      volume: 0,
      trades: 0,
    };
  }

  // Subscribe to BIST ticks
  onBISTTick((tick: BISTTick) => {
    if (!symbols.includes(tick.symbol)) return;

    const s = state[tick.symbol] || {
      cvd: 0,
      nmf: 0,
      obi: 0,
      vwap: 0,
      volume: 0,
      trades: 0,
    };

    // Determine direction
    const direction = tick.side === 'B' ? 1 : -1;

    // Update CVD (Cumulative Volume Delta)
    s.cvd += direction * tick.quantity;

    // Update NMF (Net Money Flow)
    s.nmf += direction * tick.quantity * tick.price;

    // Update VWAP
    const totalValue = s.vwap * s.volume + tick.price * tick.quantity;
    s.volume += tick.quantity;
    s.vwap = s.volume > 0 ? totalValue / s.volume : tick.price;

    // Update trade count
    s.trades += 1;

    // Mock OBI (Order Book Imbalance)
    // In real implementation, this would use depth data
    // For now, use CVD as approximation
    s.obi = Math.max(-1, Math.min(1, s.cvd / 100000));

    // Save state
    state[tick.symbol] = s;

    // Update Prometheus metrics
    bistMetrics.cvd.set({ symbol: tick.symbol }, s.cvd);
    bistMetrics.nmf.set({ symbol: tick.symbol, timeframe: '1m' }, s.nmf);
    bistMetrics.obi.set({ symbol: tick.symbol }, s.obi);
    bistMetrics.vwap.set({ symbol: tick.symbol }, s.vwap);
  });

  // Return snapshot function
  return {
    snapshot: () => ({ ...state }),
  };
}

/**
 * Get current money flow metrics for a symbol
 */
export function getMoneyFlowMetrics(symbol: string): MoneyFlowMetrics | null {
  return state[symbol] || null;
}

/**
 * Get all money flow metrics
 */
export function getAllMoneyFlowMetrics(): Record<string, MoneyFlowMetrics> {
  return { ...state };
}

/**
 * Reset money flow state (for testing or period reset)
 */
export function resetMoneyFlowState(symbol?: string): void {
  if (symbol) {
    if (state[symbol]) {
      state[symbol] = {
        cvd: 0,
        nmf: 0,
        obi: 0,
        vwap: 0,
        volume: 0,
        trades: 0,
      };
    }
  } else {
    // Reset all
    for (const sym of Object.keys(state)) {
      state[sym] = {
        cvd: 0,
        nmf: 0,
        obi: 0,
        vwap: 0,
        volume: 0,
        trades: 0,
      };
    }
  }
  console.log('[MoneyFlow] State reset:', symbol || 'all symbols');
}

