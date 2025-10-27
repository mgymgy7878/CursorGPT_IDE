import type { Symbol, Price, Quantity } from "@spark/types";
import { asPrice } from "@spark/types";

export interface RiskRule {
  id: string;
  name: string;
  type: 'MIN_NOTIONAL' | 'MAX_POSITION_SIZE' | 'PER_SYMBOL_EXPOSURE' | 'GLOBAL_DAILY_LOSS' | 'MAX_ORDER_SIZE';
  symbol?: Symbol;
  value: number;
  enabled: boolean;
  description: string;
}

export interface PnLData {
  symbol: Symbol;
  realizedPnL: Price;
  unrealizedPnL: Price;
  totalPnL: Price;
  timestamp: number;
}

export class RiskManager {
  private rules: RiskRule[] = [];

  addRule(rule: RiskRule): void {
    this.rules.push(rule);
  }

  validateOrder(symbol: Symbol, quantity: Quantity, price: Price): boolean {
    return true;
  }
}

export class PnLTracker {
  private pnlData: Map<Symbol, PnLData> = new Map();

  updatePnL(symbol: Symbol, realized: Price, unrealized: Price): void {
    this.pnlData.set(symbol, {
      symbol,
      realizedPnL: realized,
      unrealizedPnL: unrealized,
      totalPnL: asPrice(realized + unrealized),
      timestamp: Date.now()
    });
  }

  getPnL(symbol: Symbol): PnLData | undefined {
    return this.pnlData.get(symbol);
  }
} 