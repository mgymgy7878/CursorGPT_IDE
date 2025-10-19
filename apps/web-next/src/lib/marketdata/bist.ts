/**
 * BIST Market Data Reader (Mock Phase)
 */

import { normalizeBISTSnapshot } from './normalize';
import { toSparkSymbol } from './symbolMap';

const MOCK_DATA: Record<string, any> = {
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

let lastFetchTime = Date.now();

export async function fetchBISTSnapshot(symbol: string) {
  const raw = MOCK_DATA[symbol];
  
  if (!raw) {
    throw new Error(`BIST symbol not found: ${symbol}`);
  }

  const sparkSymbol = toSparkSymbol('bist', symbol);
  lastFetchTime = Date.now();
  
  return normalizeBISTSnapshot({
    ...raw,
    timestamp: Date.now(),
  }, sparkSymbol);
}

export async function fetchBISTSnapshots(symbols: string[]) {
  const results = await Promise.allSettled(
    symbols.map(symbol => fetchBISTSnapshot(symbol))
  );

  return results
    .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
    .map(r => r.value);
}

export function getBISTStaleness(): number {
  return Math.floor((Date.now() - lastFetchTime) / 1000);
}

