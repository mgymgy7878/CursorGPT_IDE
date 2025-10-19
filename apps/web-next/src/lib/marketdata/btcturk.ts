/**
 * BTCTurk REST API Client (Simplified)
 */

import { normalizeBTCTurkTicker } from './normalize';
import { toSparkSymbol } from './symbolMap';

const BASE_URL = 'https://api.btcturk.com';
const cache = new Map<string, { data: any; expires: number }>();

export async function fetchBTCTurkTicker(symbol: string) {
  const cacheKey = `ticker:${symbol}`;
  const cached = cache.get(cacheKey);

  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }

  try {
    const response = await fetch(`${BASE_URL}/api/v2/ticker?pairSymbol=${symbol}`, {
      signal: AbortSignal.timeout(3000),
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`BTCTurk API: ${response.status}`);
    }

    const data = await response.json();
    const raw = Array.isArray(data.data) ? data.data[0] : data.data;
    
    if (!raw) {
      throw new Error('No ticker data');
    }

    const sparkSymbol = toSparkSymbol('btcturk', symbol);
    const normalized = normalizeBTCTurkTicker(raw, sparkSymbol);

    cache.set(cacheKey, {
      data: normalized,
      expires: Date.now() + 5000,
    });

    return normalized;
  } catch (err) {
    throw err;
  }
}

