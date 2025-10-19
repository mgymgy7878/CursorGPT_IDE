/**
 * Symbol Mapping & Normalization
 * Unified SPARK:<venue>:<symbol> format
 */

export interface SymbolMapping {
  spark: string;
  venue: string;
  native: string;
  base: string;
  quote: string;
}

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
  'XRP_TRY': {
    spark: 'SPARK:BTCTURK:XRP_TRY',
    venue: 'btcturk',
    native: 'XRP_TRY',
    base: 'XRP',
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

export function toSparkSymbol(venue: string, nativeSymbol: string): string {
  if (venue === 'btcturk') {
    return BTCTURK_SYMBOLS[nativeSymbol]?.spark || `SPARK:BTCTURK:${nativeSymbol}`;
  } else if (venue === 'bist') {
    return BIST_SYMBOLS[nativeSymbol]?.spark || `SPARK:BIST:${nativeSymbol}`;
  }
  return `SPARK:${venue.toUpperCase()}:${nativeSymbol}`;
}

