import type { Symbol, Price, Quantity } from "@spark/types";

export interface BinanceConfig {
  apiKey: string;
  secretKey: string;
  testnet?: boolean;
}

export class BinanceAdapter {
  constructor(private config: BinanceConfig) {}

  async getAccountInfo(): Promise<any> {
    // Stub implementation
    return { balances: [] };
  }

  async placeOrder(symbol: Symbol, side: 'BUY' | 'SELL', quantity: Quantity, price?: Price): Promise<string> {
    // Stub implementation
    return 'mock-order-id';
  }

  async cancelOrder(orderId: string): Promise<void> {
    // Stub implementation
  }

  async getPositions(): Promise<any[]> {
    // Stub implementation
    return [];
  }
} 