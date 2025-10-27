import { EventEmitter } from 'events';
import { prometheus } from './metrics.js';

export class PaperTrader extends EventEmitter {
  private initialCapital: number;
  private commission: number;
  private slippage: number;
  private tPlusOne: boolean;
  private cash: number;
  private positions: Map<string, number> = new Map();
  private trades: any[] = [];
  private pnl: number = 0;
  private backtestPnL: number = 0;

  constructor(options: {
    initialCapital?: number;
    commission?: number;
    slippage?: number;
    tPlusOne?: boolean;
  } = {}) {
    super();
    this.initialCapital = options.initialCapital || 10000;
    this.commission = options.commission || 0.001;
    this.slippage = options.slippage || 0.0005;
    this.tPlusOne = options.tPlusOne || true;
    this.cash = this.initialCapital;
  }

  async executeTrade(
    symbol: string,
    side: 'buy' | 'sell',
    quantity: number,
    price: number,
    timestamp: Date
  ) {
    const startTime = Date.now();
    
    try {
      // Apply slippage
      const slippagePrice = side === 'buy' 
        ? price * (1 + this.slippage)
        : price * (1 - this.slippage);
      
      // Calculate commission
      const commission = quantity * slippagePrice * this.commission;
      
      // Check if we have enough cash for buy orders
      if (side === 'buy') {
        const totalCost = quantity * slippagePrice + commission;
        if (totalCost > this.cash) {
          throw new Error('Insufficient cash for buy order');
        }
        this.cash -= totalCost;
      } else {
        // Check if we have enough position for sell orders
        const currentPosition = this.positions.get(symbol) || 0;
        if (quantity > currentPosition) {
          throw new Error('Insufficient position for sell order');
        }
        this.cash += quantity * slippagePrice - commission;
      }
      
      // Update position
      const currentPosition = this.positions.get(symbol) || 0;
      const newPosition = side === 'buy' 
        ? currentPosition + quantity
        : currentPosition - quantity;
      
      this.positions.set(symbol, newPosition);
      
      // Record trade
      const trade = {
        symbol,
        side,
        quantity,
        price: slippagePrice,
        commission,
        timestamp,
        cash: this.cash,
        position: newPosition
      };
      
      this.trades.push(trade);
      
      // Calculate PnL
      this.calculatePnL();
      
      const latency = Date.now() - startTime;
      prometheus.paperFillLatencyMs.observe({ symbol }, latency);
      
      this.emit('trade', trade);
      
      return trade;
      
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  private calculatePnL() {
    let totalPnL = 0;
    
    for (const [symbol, position] of this.positions) {
      // This would use current market price
      // For now, we'll use a mock calculation
      const currentPrice = 50000; // Mock price
      const avgPrice = this.calculateAveragePrice(symbol);
      const pnl = position * (currentPrice - avgPrice);
      totalPnL += pnl;
    }
    
    this.pnl = totalPnL;
    prometheus.paperPnL.set({}, this.pnl);
  }

  private calculateAveragePrice(symbol: string): number {
    const symbolTrades = this.trades.filter(t => t.symbol === symbol);
    if (symbolTrades.length === 0) return 0;
    
    let totalQuantity = 0;
    let totalValue = 0;
    
    for (const trade of symbolTrades) {
      if (trade.side === 'buy') {
        totalQuantity += trade.quantity;
        totalValue += trade.quantity * trade.price;
      }
    }
    
    return totalQuantity > 0 ? totalValue / totalQuantity : 0;
  }

  calculateDrift(backtestPnL: number): number {
    this.backtestPnL = backtestPnL;
    const drift = Math.abs(this.pnl - backtestPnL) / Math.max(1, Math.abs(backtestPnL));
    prometheus.paperPnLDrift.set({}, drift);
    return drift;
  }

  getStatus() {
    return {
      cash: this.cash,
      positions: Object.fromEntries(this.positions),
      pnl: this.pnl,
      trades: this.trades.length,
      drift: this.calculateDrift(this.backtestPnL)
    };
  }

  reset() {
    this.cash = this.initialCapital;
    this.positions.clear();
    this.trades = [];
    this.pnl = 0;
    this.backtestPnL = 0;
  }
}
