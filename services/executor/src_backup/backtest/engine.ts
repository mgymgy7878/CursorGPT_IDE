import { Strategy } from "@spark/trading-core";

export interface OHLCV {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface BacktestParams {
  strategy: Strategy;
  data: OHLCV[];
  initialCapital: number;
  commission: number; // Percentage
  slippage: number; // Percentage
  startDate?: string;
  endDate?: string;
}

export interface Trade {
  timestamp: number;
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  commission: number;
  slippage: number;
}

export interface Position {
  symbol: string;
  quantity: number;
  avgPrice: number;
  unrealizedPnL: number;
  realizedPnL: number;
}

export interface BacktestReport {
  summary: {
    totalReturn: number;
    totalPnL: number;
    maxDrawdown: number;
    winRate: number;
    sharpeRatio: number;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    avgWin: number;
    avgLoss: number;
    profitFactor: number;
  };
  trades: Trade[];
  equity: Array<{ timestamp: number; equity: number }>;
  positions: Position[];
  metadata: {
    startDate: string;
    endDate: string;
    initialCapital: number;
    finalCapital: number;
    duration: number;
  };
}

export class BacktestEngine {
  private params: BacktestParams;
  private positions: Map<string, Position> = new Map();
  private trades: Trade[] = [];
  private equity: Array<{ timestamp: number; equity: number }> = [];
  private currentCapital: number;

  constructor(params: BacktestParams) {
    this.params = params;
    this.currentCapital = params.initialCapital;
  }

  async run(): Promise<BacktestReport> {
    const strategy = this.params.strategy;
    const data = this.filterDataByDate(this.params.data);
    
    // Initialize strategy
    strategy.init();
    
    // Process each bar
    for (const bar of data) {
      // Update current price for position calculations
      this.updatePositions(bar);
      
      // Get strategy signals
      const orders = strategy.onBar(bar);
      
      // Execute orders
      for (const order of orders) {
        this.executeOrder(order, bar);
      }
      
      // Record equity
      this.recordEquity(bar.timestamp);
    }
    
    return this.generateReport(data);
  }

  private filterDataByDate(data: OHLCV[]): OHLCV[] {
    let filtered = data;
    
    if (this.params.startDate) {
      const startTs = new Date(this.params.startDate).getTime();
      filtered = filtered.filter(bar => bar.timestamp >= startTs);
    }
    
    if (this.params.endDate) {
      const endTs = new Date(this.params.endDate).getTime();
      filtered = filtered.filter(bar => bar.timestamp <= endTs);
    }
    
    return filtered;
  }

  private executeOrder(order: any, bar: OHLCV): void {
    const executionPrice = this.calculateExecutionPrice(order, bar);
    const commission = (executionPrice * order.quantity * this.params.commission) / 100;
    const slippage = (executionPrice * order.quantity * this.params.slippage) / 100;
    
    const trade: Trade = {
      timestamp: bar.timestamp,
      symbol: order.symbol,
      side: order.side,
      quantity: order.quantity,
      price: executionPrice,
      commission,
      slippage
    };
    
    this.trades.push(trade);
    
    // Update position
    this.updatePosition(trade);
    
    // Update capital
    const totalCost = (executionPrice * order.quantity) + commission + slippage;
    if (order.side === 'BUY') {
      this.currentCapital -= totalCost;
    } else {
      this.currentCapital += totalCost;
    }
  }

  private calculateExecutionPrice(order: any, bar: OHLCV): number {
    if (order.type === 'MARKET') {
      return order.side === 'BUY' ? bar.high : bar.low; // Worst case execution
    } else {
      return order.price || bar.close;
    }
  }

  private updatePosition(trade: Trade): void {
    const existing = this.positions.get(trade.symbol);
    
    if (trade.side === 'BUY') {
      if (existing) {
        // Add to existing position
        const totalQuantity = existing.quantity + trade.quantity;
        const totalValue = (existing.avgPrice * existing.quantity) + (trade.price * trade.quantity);
        existing.avgPrice = totalValue / totalQuantity;
        existing.quantity = totalQuantity;
      } else {
        // New position
        this.positions.set(trade.symbol, {
          symbol: trade.symbol,
          quantity: trade.quantity,
          avgPrice: trade.price,
          unrealizedPnL: 0,
          realizedPnL: 0
        });
      }
    } else {
      if (existing) {
        // Close or reduce position
        const closeQuantity = Math.min(existing.quantity, trade.quantity);
        const pnl = (trade.price - existing.avgPrice) * closeQuantity;
        
        existing.realizedPnL += pnl;
        existing.quantity -= closeQuantity;
        
        if (existing.quantity <= 0) {
          this.positions.delete(trade.symbol);
        }
      }
    }
  }

  private updatePositions(bar: OHLCV): void {
    for (const position of this.positions.values()) {
      position.unrealizedPnL = (bar.close - position.avgPrice) * position.quantity;
    }
  }

  private recordEquity(timestamp: number): void {
    const totalEquity = this.currentCapital + this.getTotalUnrealizedPnL();
    this.equity.push({ timestamp, equity: totalEquity });
  }

  private getTotalUnrealizedPnL(): number {
    return Array.from(this.positions.values())
      .reduce((sum, pos) => sum + pos.unrealizedPnL, 0);
  }

  private generateReport(data: OHLCV[]): BacktestReport {
    const winningTrades = this.trades.filter(t => this.calculateTradePnL(t) > 0);
    const losingTrades = this.trades.filter(t => this.calculateTradePnL(t) < 0);
    
    const totalPnL = this.calculateTotalPnL();
    const maxDrawdown = this.calculateMaxDrawdown();
    const sharpeRatio = this.calculateSharpeRatio();
    
    const summary = {
      totalReturn: ((this.currentCapital - this.params.initialCapital) / this.params.initialCapital) * 100,
      totalPnL,
      maxDrawdown,
      winRate: this.trades.length > 0 ? (winningTrades.length / this.trades.length) * 100 : 0,
      sharpeRatio,
      totalTrades: this.trades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      avgWin: winningTrades.length > 0 ? winningTrades.reduce((sum, t) => sum + this.calculateTradePnL(t), 0) / winningTrades.length : 0,
      avgLoss: losingTrades.length > 0 ? losingTrades.reduce((sum, t) => sum + this.calculateTradePnL(t), 0) / losingTrades.length : 0,
      profitFactor: losingTrades.length > 0 ? Math.abs(winningTrades.reduce((sum, t) => sum + this.calculateTradePnL(t), 0) / losingTrades.reduce((sum, t) => sum + this.calculateTradePnL(t), 0)) : 0
    };
    
    const metadata = {
      startDate: new Date(data[0]?.timestamp || 0).toISOString(),
      endDate: new Date(data[data.length - 1]?.timestamp || 0).toISOString(),
      initialCapital: this.params.initialCapital,
      finalCapital: this.currentCapital,
      duration: data.length
    };
    
    return {
      summary,
      trades: this.trades,
      equity: this.equity,
      positions: Array.from(this.positions.values()),
      metadata
    };
  }

  private calculateTradePnL(trade: Trade): number {
    // Simplified P&L calculation
    return trade.side === 'BUY' ? -trade.commission - trade.slippage : trade.commission + trade.slippage;
  }

  private calculateTotalPnL(): number {
    return this.currentCapital - this.params.initialCapital;
  }

  private calculateMaxDrawdown(): number {
    let maxDrawdown = 0;
    let peak = this.params.initialCapital;
    
    for (const point of this.equity) {
      if (point.equity > peak) {
        peak = point.equity;
      }
      
      const drawdown = (peak - point.equity) / peak * 100;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }
    
    return maxDrawdown;
  }

  private calculateSharpeRatio(): number {
    if (this.equity.length < 2) return 0;
    
    const returns = [];
    for (let i = 1; i < this.equity.length; i++) {
      const return_ = (this.equity[i]?.equity && this.equity[i-1]?.equity) 
        ? (this.equity[i].equity - this.equity[i-1].equity) / this.equity[i-1].equity
        : 0;
      returns.push(return_);
    }
    
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    
    return stdDev > 0 ? avgReturn / stdDev : 0;
  }
} 