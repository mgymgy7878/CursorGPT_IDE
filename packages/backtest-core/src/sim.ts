import type { Symbol, Price, Quantity } from "@spark/types";

export interface Bar {
  timestamp: number;
  open: Price;
  high: Price;
  low: Price;
  close: Price;
  volume: Quantity;
  symbol: Symbol;
}

export interface Trade {
  timestamp: number;
  symbol: Symbol;
  side: 'BUY' | 'SELL';
  price: Price;
  quantity: Quantity;
}

export interface BacktestResult {
  totalReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  totalTrades: number;
  winRate: number;
  profitFactor: number;
  averageTrade: number;
  equity: number[];
  trades: Trade[];
}

export class BacktestSimulator {
  private bars: Bar[] = [];
  private trades: Trade[] = [];
  private equity: number[] = [];
  private currentEquity = 10000; // Starting capital
  private position = 0;
  private entryPrice = 0;

  constructor(bars: Bar[]) {
    this.bars = bars;
    this.equity = [this.currentEquity];
  }

  runBacktest(strategy: (bar: Bar) => 'BUY' | 'SELL' | 'HOLD'): BacktestResult {
    for (const bar of this.bars) {
      const signal = strategy(bar);
      
      if (signal === 'BUY' && this.position <= 0) {
        this.enterPosition(bar, 'BUY');
      } else if (signal === 'SELL' && this.position >= 0) {
        this.enterPosition(bar, 'SELL');
      }
      
      this.updateEquity(bar);
    }

    return this.calculateResults();
  }

  private enterPosition(bar: Bar, side: 'BUY' | 'SELL') {
    const quantity = Math.floor(this.currentEquity * 0.1 / (bar.close as unknown as number)); // 10% of equity
    const trade: Trade = {
      timestamp: bar.timestamp,
      symbol: bar.symbol,
      side,
      price: bar.close,
      quantity
    } as Trade;

    this.trades.push(trade);
    this.position = side === 'BUY' ? (quantity as unknown as number) : -(quantity as unknown as number);
    this.entryPrice = bar.close as unknown as number;
  }

  private updateEquity(bar: Bar) {
    if (this.position !== 0) {
      const pnl = this.position * ((bar.close as unknown as number) - this.entryPrice);
      this.currentEquity += pnl;
    }
    this.equity.push(this.currentEquity);
  }

  private calculateResults(): BacktestResult {
    const totalReturn = (this.currentEquity - 10000) / 10000;
    const returns: number[] = [];
    for (let i = 1; i < this.equity.length; i++) {
      const prev = this.equity[i - 1];
      const curr = this.equity[i];
      if (prev !== undefined && curr !== undefined) {
      const ret = prev !== 0 ? (curr - prev) / prev : 0;
      returns.push(ret);
      }
    }

    const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / (returns.length || 1);
    const stdReturn = Math.sqrt(
      returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / (returns.length || 1)
    );
    const sharpeRatio = stdReturn > 0 ? avgReturn / stdReturn : 0;

    let maxDrawdown = 0;
    let peak = this.equity[0] ?? 0;
    for (const equity of this.equity) {
      if (equity !== undefined && equity > peak) {
        peak = equity;
      }
      if (equity !== undefined) {
      const drawdown = peak > 0 ? (peak - equity) / peak : 0;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
        }
      }
    }

    const winningTrades = this.trades.filter(trade => {
      const nextTrade = this.trades.find(t => 
        t.timestamp > trade.timestamp && t.side !== trade.side
      );
      if (!nextTrade) return false;
      return (trade.side === 'BUY' && (nextTrade.price as unknown as number) > (trade.price as unknown as number)) ||
             (trade.side === 'SELL' && (nextTrade.price as unknown as number) < (trade.price as unknown as number));
    });

    const winRate = this.trades.length > 0 ? winningTrades.length / this.trades.length : 0;
    const averageTrade = this.trades.length > 0 ? totalReturn / this.trades.length : 0;

    return {
      totalReturn,
      sharpeRatio,
      maxDrawdown,
      totalTrades: this.trades.length,
      winRate,
      profitFactor: 1, // Simplified
      averageTrade,
      equity: this.equity,
      trades: this.trades
    } as BacktestResult;
  }
} 