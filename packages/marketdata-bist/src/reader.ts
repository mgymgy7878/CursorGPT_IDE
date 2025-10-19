/**
 * BIST Market Data Reader
 * Phase 1: Polling-based (mock/placeholder)
 * Phase 2: Real vendor integration
 */

import { normalizeBISTSnapshot } from '@marketdata/common/normalize';
import { toSparkSymbol } from '@marketdata/common/symbolMap';

const MOCK_DATA = {
  'THYAO': {
    lastPrice: 350.50,
    volume: 12500000,
    high: 355.00,
    low: 348.00,
    changePercent: 1.25,
  },
  'AKBNK': {
    lastPrice: 52.80,
    volume: 85000000,
    high: 53.20,
    low: 52.40,
    changePercent: 0.95,
  },
};

/**
 * Fetch BIST snapshot
 */
export async function fetchBISTSnapshot(symbol: string) {
  // Phase 1: Mock data
  // TODO: Replace with real vendor API
  
  const raw = MOCK_DATA[symbol as keyof typeof MOCK_DATA];
  
  if (!raw) {
    throw new Error(`BIST symbol not found: ${symbol}`);
  }

  const sparkSymbol = toSparkSymbol('bist', symbol);
  
  return normalizeBISTSnapshot({
    ...raw,
    timestamp: Date.now(),
  }, sparkSymbol);
}

/**
 * Fetch multiple symbols
 */
export async function fetchBISTSnapshots(symbols: string[]) {
  const results = await Promise.allSettled(
    symbols.map(symbol => fetchBISTSnapshot(symbol))
  );

  return results
    .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
    .map(r => r.value);
}

/**
 * Get staleness (for health check)
 */
export function getBISTStaleness(): number {
  // Mock: always fresh
  // Real implementation: check last successful fetch
  return 0;
}

