import type { Price, Quantity, Symbol } from "@spark/types";
import { asPrice, asQuantity, asSymbol } from "@spark/types";

export interface BTCTurkSymbolInfo {
  symbol: string;
  minNotional: number;
  lotStep: number;
  tickSize: number;
  minQty: number;
  maxQty: number;
}

// BTCTurk symbol mapping
export const BTCTURK_SYMBOL_MAP: Record<string, string> = {
  'BTCUSDT': 'BTCTRY',
  'ETHUSDT': 'ETHTRY',
  'ADAUSDT': 'ADATRY',
  'DOTUSDT': 'DOTTRY',
  'LINKUSDT': 'LINKTRY'
};

export const BTCTURK_REVERSE_MAP: Record<string, string> = {
  'BTCTRY': 'BTCUSDT',
  'ETHTRY': 'ETHUSDT',
  'ADATRY': 'ADAUSDT',
  'DOTTRY': 'DOTUSDT',
  'LINKTRY': 'LINKUSDT'
};

export function mapToBTCTurk(symbol: Symbol): string {
  return BTCTURK_SYMBOL_MAP[symbol] || symbol;
}

export function mapFromBTCTurk(btcturkSymbol: string): Symbol {
  return asSymbol(BTCTURK_REVERSE_MAP[btcturkSymbol] || btcturkSymbol);
}

export function asBTCTurkSymbol(symbol: string): string {
  return mapToBTCTurk(asSymbol(symbol));
}

export function fromBTCTurkSymbol(btcturkSymbol: string): Symbol {
  return mapFromBTCTurk(btcturkSymbol);
}

// BTCTurk symbol info (placeholder - gerçek API'den alınacak)
export const BTCTURK_SYMBOL_INFO: Record<string, BTCTurkSymbolInfo> = {
  'BTCTRY': {
    symbol: 'BTCTRY',
    minNotional: 50, // 50 TRY
    lotStep: 0.00001,
    tickSize: 0.01,
    minQty: 0.00001,
    maxQty: 1000
  },
  'ETHTRY': {
    symbol: 'ETHTRY',
    minNotional: 50,
    lotStep: 0.001,
    tickSize: 0.01,
    minQty: 0.001,
    maxQty: 10000
  }
};

export function validateMinNotional(price: number, quantity: number, symbol: string): boolean {
  const info = BTCTURK_SYMBOL_INFO[symbol];
  if (!info) return true; // Unknown symbol, skip validation
  
  return price * quantity >= info.minNotional;
}

export function roundToLotStep(quantity: number, symbol: string): Quantity {
  const info = BTCTURK_SYMBOL_INFO[symbol];
  if (!info) return asQuantity(quantity);
  
  const rounded = Math.round(quantity / info.lotStep) * info.lotStep;
  return asQuantity(Math.max(info.minQty, Math.min(info.maxQty, rounded)));
}

export function roundToTickSize(price: number, symbol: string): Price {
  const info = BTCTURK_SYMBOL_INFO[symbol];
  if (!info) return asPrice(price);
  
  const rounded = Math.round(price / info.tickSize) * info.tickSize;
  return asPrice(rounded);
}

export function autoRoundOrder(price: number, quantity: number, symbol: string): {
  price: Price;
  quantity: Quantity;
  isValid: boolean;
} {
  const roundedPrice = roundToTickSize(price, symbol);
  const roundedQuantity = roundToLotStep(quantity, symbol);
  
  const isValid = validateMinNotional(roundedPrice, roundedQuantity, symbol);
  
  return {
    price: roundedPrice,
    quantity: roundedQuantity,
    isValid
  };
}

export function getSymbolInfo(symbol: string): BTCTurkSymbolInfo | null {
  return BTCTURK_SYMBOL_INFO[symbol] || null;
} 