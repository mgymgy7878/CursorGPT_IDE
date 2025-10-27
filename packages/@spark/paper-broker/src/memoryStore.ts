import type { Order, Fill, Position, Account } from "./types";

export interface Store {
  // Orders
  getOrders(): Order[];
  getOrder(id: string): Order | undefined;
  saveOrder(order: Order): void;
  updateOrder(id: string, updates: Partial<Order>): void;
  
  // Fills
  getFills(): Fill[];
  saveFill(fill: Fill): void;
  
  // Positions
  getPositions(): Position[];
  getPosition(symbol: string): Position | undefined;
  savePosition(position: Position): void;
  deletePosition(symbol: string): void;
  
  // Account
  getAccount(): Account;
  updateAccount(updates: Partial<Account>): void;
  
  // Reset
  reset(): void;
}

export class MemoryStore implements Store {
  private orders = new Map<string, Order>();
  private fills = new Map<string, Fill>();
  private positions = new Map<string, Position>();
  private account: Account = {
    balance: 10000, // Starting balance
    equity: 10000,
    realizedPnL: 0,
    unrealizedPnL: 0,
    totalPnL: 0,
    dailyPnL: 0,
    totalFees: 0,
    feesAccrued: 0,
    updatedAt: Date.now()
  };

  // Orders
  getOrders(): Order[] {
    return Array.from(this.orders.values());
  }

  getOrder(id: string): Order | undefined {
    return this.orders.get(id);
  }

  saveOrder(order: Order): void {
    this.orders.set(order.id, order);
  }

  updateOrder(id: string, updates: Partial<Order>): void {
    const order = this.orders.get(id);
    if (order) {
      this.orders.set(id, { ...order, ...updates });
    }
  }

  // Fills
  getFills(): Fill[] {
    return Array.from(this.fills.values()).sort((a, b) => b.timestamp - a.timestamp);
  }

  saveFill(fill: Fill): void {
    this.fills.set(fill.id, fill);
  }

  // Positions
  getPositions(): Position[] {
    return Array.from(this.positions.values());
  }

  getPosition(symbol: string): Position | undefined {
    return this.positions.get(symbol);
  }

  savePosition(position: Position): void {
    this.positions.set(position.symbol, position);
  }

  deletePosition(symbol: string): void {
    this.positions.delete(symbol);
  }

  // Account
  getAccount(): Account {
    return { ...this.account };
  }

  updateAccount(updates: Partial<Account>): void {
    this.account = { ...this.account, ...updates, updatedAt: Date.now() };
  }

  // Reset
  reset(): void {
    this.orders.clear();
    this.fills.clear();
    this.positions.clear();
    this.account = {
      balance: 10000,
      equity: 10000,
      realizedPnL: 0,
      unrealizedPnL: 0,
      totalPnL: 0,
      dailyPnL: 0,
      totalFees: 0,
      feesAccrued: 0,
      updatedAt: Date.now()
    };
  }
} 