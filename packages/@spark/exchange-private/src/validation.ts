import type { Symbol, Price, Quantity } from "@spark/types";

export interface SymbolFilters {
  filterType: string;
  minPrice?: Price;
  maxPrice?: Price;
  tickSize?: Price;
  minQty?: Quantity;
  maxQty?: Quantity;
  stepSize?: Quantity;
  minNotional?: Price;
  applyToMarket?: boolean;
  avgPriceMins?: number;
  limit?: number;
  maxNumOrders?: number;
  maxNumAlgoOrders?: number;
}

export function isAllowedSymbol(symbol: Symbol, allowedSymbols: Symbol[]): boolean {
  return allowedSymbols.includes(symbol);
}

export function checkMinQty(quantity: Quantity, minQty: Quantity): boolean {
  return quantity >= minQty;
}

export function clampToStep(value: number, stepSize: number): number {
  return Math.round(value / stepSize) * stepSize;
}

export function validateMinNotional(price: Price, quantity: Quantity, minNotional: Price): boolean {
  return price * quantity >= minNotional;
} 