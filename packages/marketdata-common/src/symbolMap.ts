/**
 * Symbol Mapping & Normalization
 * Unified SPARK:<venue>:<symbol> format
 */

export interface SymbolMapping {
  spark: string;      // SPARK:BTCTURK:BTC_TRY
  venue: string;      // btcturk
  native: string;     // BTC_TRY
  base: string;       // BTC
  quote: string;      // TRY
}

// BTCTurk symbols
const BTCTURK_SYMBOLS: Record<string, SymbolMapping> = {
  'BTC_TRY': {
    spark: 'SPARK:BTCTURK:BTC_TRY',
    venue: 'btcturk',
    native: 'BTC_TRY',
    base: 'BTC',
    quote: 'TRY',
  },
  'ETH_TRY': {
    spark: 'SPARK:BTCTURK:ETH_TRY',
    venue: 'btcturk',
    native: 'ETH_TRY',
    base: 'ETH',
    quote: 'TRY',
  },
  'USDT_TRY': {
    spark: 'SPARK:BTCTURK:USDT_TRY',
    venue: 'btcturk',
    native: 'USDT_TRY',
    base: 'USDT',
    quote: 'TRY',
  },
};

// BIST symbols
const BIST_SYMBOLS: Record<string, SymbolMapping> = {
  'THYAO': {
    spark: 'SPARK:BIST:THYAO',
    venue: 'bist',
    native: 'THYAO',
    base: 'THYAO',
    quote: 'TRY',
  },
  'AKBNK': {
    spark: 'SPARK:BIST:AKBNK',
    venue: 'bist',
    native: 'AKBNK',
    base: 'AKBNK',
    quote: 'TRY',
  },
};

/**
 * Convert native symbol to SPARK format
 */
export function toSparkSymbol(venue: string, nativeSymbol: string): string {
  if (venue === 'btcturk') {
    return BTCTURK_SYMBOLS[nativeSymbol]?.spark || `SPARK:BTCTURK:${nativeSymbol}`;
  } else if (venue === 'bist') {
    return BIST_SYMBOLS[nativeSymbol]?.spark || `SPARK:BIST:${nativeSymbol}`;
  }
  return `SPARK:${venue.toUpperCase()}:${nativeSymbol}`;
}

/**
 * Parse SPARK symbol
 */
export function parseSparkSymbol(sparkSymbol: string): {
  venue: string;
  native: string;
} | null {
  const match = sparkSymbol.match(/^SPARK:([^:]+):(.+)$/);
  if (!match) return null;
  
  return {
    venue: match[1].toLowerCase(),
    native: match[2],
  };
}

/**
 * Get symbol mapping
 */
export function getSymbolMapping(venue: string, nativeSymbol: string): SymbolMapping | null {
  if (venue === 'btcturk') {
    return BTCTURK_SYMBOLS[nativeSymbol] || null;
  } else if (venue === 'bist') {
    return BIST_SYMBOLS[nativeSymbol] || null;
  }
  return null;
}

/**
 * Get all symbols for venue
 */
export function getVenueSymbols(venue: string): SymbolMapping[] {
  if (venue === 'btcturk') {
    return Object.values(BTCTURK_SYMBOLS);
  } else if (venue === 'bist') {
    return Object.values(BIST_SYMBOLS);
  }
  return [];
}

