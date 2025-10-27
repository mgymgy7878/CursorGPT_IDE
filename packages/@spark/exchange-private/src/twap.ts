import type { Symbol, Quantity } from "@spark/types";

export interface TwapOrder {
  id: string;
  symbol: Symbol;
  side: 'BUY' | 'SELL';
  quantity: Quantity;
  duration: number; // seconds
  startTime: number;
  endTime: number;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
}

export function createTwap(
  symbol: Symbol,
  side: 'BUY' | 'SELL',
  quantity: Quantity,
  duration: number
): TwapOrder {
  const now = Date.now();
  return {
    id: `twap_${Date.now()}`,
    symbol,
    side,
    quantity,
    duration,
    startTime: now,
    endTime: now + duration * 1000,
    status: 'PENDING'
  };
}

export function cancelTwap(twapId: string): boolean {
  // Placeholder implementation
  return true;
} 