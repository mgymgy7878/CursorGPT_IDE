import type { Symbol } from "@spark/types";
import { asSymbol } from "@spark/types";

// BTCTurk symbol mapping
export const BTCTURK_SYMBOL_MAP: Record<string, string> = {
  'BTCUSDT': 'BTCTRY',
  'ETHUSDT': 'ETHTRY',
  'BNBUSDT': 'BNBTRY',
  'ADAUSDT': 'ADATRY',
  'DOTUSDT': 'DOTTRY',
  'LINKUSDT': 'LINKTRY',
  'LTCUSDT': 'LTCTRY',
  'BCHUSDT': 'BCHTRY',
  'XRPUSDT': 'XRPTRY',
  'EOSUSDT': 'EOSTRY'
};

// Reverse mapping
export const BTCTURK_REVERSE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(BTCTURK_SYMBOL_MAP).map(([k, v]) => [v, k])
);

export function mapToBTCTurk(symbol: string): string {
  return BTCTURK_SYMBOL_MAP[symbol] || symbol;
}

export function mapFromBTCTurk(btcturkSymbol: string): string {
  return BTCTURK_REVERSE_MAP[btcturkSymbol] || btcturkSymbol;
}

export function asBTCTurkSymbol(symbol: Symbol): string {
  return mapToBTCTurk(symbol);
}

export function fromBTCTurkSymbol(btcturkSymbol: string): Symbol {
  return asSymbol(mapFromBTCTurk(btcturkSymbol));
} 