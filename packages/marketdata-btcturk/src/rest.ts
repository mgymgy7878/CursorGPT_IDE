/**
 * BTCTurk REST API Client
 * Docs: https://docs.btcturk.com/
 */

import { withRateLimit } from '@marketdata/common/ratelimit';
import { normalizeBTCTurkTicker, extractPrecision } from '@marketdata/common/normalize';
import { toSparkSymbol } from '@marketdata/common/symbolMap';

const BASE_URL = 'https://api.btcturk.com';

// In-memory cache (5 seconds)
const cache = new Map<string, { data: any; expires: number }>();

/**
 * Fetch ticker data
 */
export async function fetchTicker(symbol?: string): Promise<any> {
  const cacheKey = `ticker:${symbol || 'all'}`;
  const cached = cache.get(cacheKey);

  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }

  return withRateLimit('btcturk', async () => {
    const url = symbol 
      ? `${BASE_URL}/api/v2/ticker?pairSymbol=${symbol}`
      : `${BASE_URL}/api/v2/ticker`;

    const response = await fetch(url, {
      signal: AbortSignal.timeout(3000),
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`BTCTurk API error: ${response.status}`);
    }

    const data = await response.json();

    // Cache for 5 seconds
    cache.set(cacheKey, {
      data,
      expires: Date.now() + 5000,
    });

    return data;
  }, 1); // Cost: 1 token
}

/**
 * Fetch exchange info (symbols, precision)
 */
export async function fetchExchangeInfo(): Promise<any> {
  const cacheKey = 'exchangeinfo';
  const cached = cache.get(cacheKey);

  // Cache for 15 seconds (static data)
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }

  return withRateLimit('btcturk', async () => {
    const response = await fetch(`${BASE_URL}/api/v2/server/exchangeinfo`, {
      signal: AbortSignal.timeout(3000),
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`BTCTurk API error: ${response.status}`);
    }

    const data = await response.json();

    cache.set(cacheKey, {
      data,
      expires: Date.now() + 15000,
    });

    return data;
  }, 1);
}

/**
 * Get normalized ticker
 */
export async function getNormalizedTicker(symbol: string) {
  try {
    const data = await fetchTicker(symbol);
    const raw = Array.isArray(data.data) ? data.data[0] : data.data;
    
    if (!raw) {
      throw new Error('No ticker data');
    }

    const sparkSymbol = toSparkSymbol('btcturk', symbol);
    return normalizeBTCTurkTicker(raw, sparkSymbol);
  } catch (err) {
    throw new Error(`Failed to fetch ticker: ${err}`);
  }
}

/**
 * Get symbol precision
 */
export async function getSymbolPrecision(symbol: string) {
  try {
    const info = await fetchExchangeInfo();
    const symbols = info.data?.symbols || [];
    const symbolInfo = symbols.find((s: any) => s.name === symbol || s.nameNormalized === symbol);

    if (!symbolInfo) {
      throw new Error(`Symbol not found: ${symbol}`);
    }

    return extractPrecision(symbolInfo, 'btcturk', symbol);
  } catch (err) {
    throw new Error(`Failed to fetch precision: ${err}`);
  }
}

/**
 * Clear cache (for testing)
 */
export function clearCache() {
  cache.clear();
}

