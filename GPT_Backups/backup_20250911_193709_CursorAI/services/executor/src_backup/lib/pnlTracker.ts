export interface PnLPosition {
  symbol: string;
  side: 'LONG' | 'SHORT';
  quantity: number;
  avgEntryPrice: number;
  currentPrice: number;
  unrealizedPnl: number;
  realizedPnl: number;
  totalPnl: number;
  pnlPercent: number;
  timestamp: number;
}

export interface PnLSummary {
  totalUnrealizedPnl: number;
  totalRealizedPnl: number;
  totalPnl: number;
  totalPnlPercent: number;
  dailyPnl: number;
  weeklyPnl: number;
  monthlyPnl: number;
  bestPerformer: string;
  worstPerformer: string;
  activePositions: number;
  timestamp: number;
}

export interface Trade {
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  timestamp: number;
  orderId: string;
  commission: number;
  commissionAsset: string;
}

export class PnLTracker {
  private positions: Map<string, PnLPosition> = new Map();
  private trades: Trade[] = [];
  private priceCache: Map<string, number> = new Map();
  private dailyPnL = 0;
  private weeklyPnL = 0;
  private monthlyPnL = 0;

  updatePosition(symbol: string, side: 'LONG' | 'SHORT', quantity: number, price: number): void {
    const key = `${symbol}_${side}`;
    const existing = this.positions.get(key);

    if (existing) {
      // Update existing position
      const totalQuantity = existing.quantity + quantity;
      const totalValue = (existing.quantity * existing.avgEntryPrice) + (quantity * price);
      const newAvgPrice = totalValue / totalQuantity;

      this.positions.set(key, {
        ...existing,
        quantity: totalQuantity,
        avgEntryPrice: newAvgPrice,
        timestamp: Date.now()
      });
    } else {
      // Create new position
      this.positions.set(key, {
        symbol,
        side,
        quantity,
        avgEntryPrice: price,
        currentPrice: price,
        unrealizedPnl: 0,
        realizedPnl: 0,
        totalPnl: 0,
        pnlPercent: 0,
        timestamp: Date.now()
      });
    }
  }

  addTrade(trade: Trade): void {
    this.trades.push(trade);
    this.updateRealizedPnl(trade);
  }

  updateCurrentPrice(symbol: string, currentPrice: number): void {
    this.priceCache.set(symbol, currentPrice);
    
    for (const [key, position] of this.positions.entries()) {
      if (position.symbol === symbol) {
        position.currentPrice = currentPrice;
        this.calculateUnrealizedPnl(position);
        this.positions.set(key, position);
      }
    }
  }

  private calculateUnrealizedPnl(position: PnLPosition): void {
    if (position.side === 'LONG') {
      position.unrealizedPnl = (position.currentPrice - position.avgEntryPrice) * position.quantity;
    } else {
      position.unrealizedPnl = (position.avgEntryPrice - position.currentPrice) * position.quantity;
    }

    position.totalPnl = position.unrealizedPnl + position.realizedPnl;
    position.pnlPercent = position.avgEntryPrice > 0 
      ? ((position.currentPrice - position.avgEntryPrice) / position.avgEntryPrice) * 100 
      : 0;
  }

  private updateRealizedPnl(trade: Trade): void {
    // Find corresponding position
    const side = trade.side === 'BUY' ? 'LONG' : 'SHORT';
    const key = `${trade.symbol}_${side}`;
    const position = this.positions.get(key);

    if (position) {
      // Calculate realized PnL based on trade direction
      if (trade.side === 'SELL' && position.side === 'LONG') {
        // Closing long position
        const pnl = (trade.price - position.avgEntryPrice) * trade.quantity;
        position.realizedPnl += pnl;
        this.dailyPnL += pnl;
        this.weeklyPnL += pnl;
        this.monthlyPnL += pnl;
      } else if (trade.side === 'BUY' && position.side === 'SHORT') {
        // Closing short position
        const pnl = (position.avgEntryPrice - trade.price) * trade.quantity;
        position.realizedPnl += pnl;
        this.dailyPnL += pnl;
        this.weeklyPnL += pnl;
        this.monthlyPnL += pnl;
      }

      // Update position
      this.positions.set(key, position);
    }
  }

  getPositions(): PnLPosition[] {
    return Array.from(this.positions.values());
  }

  getPosition(symbol: string, side: 'LONG' | 'SHORT'): PnLPosition | null {
    const key = `${symbol}_${side}`;
    return this.positions.get(key) || null;
  }

  getTrades(symbol?: string): Trade[] {
    if (symbol) {
      return this.trades.filter(t => t.symbol === symbol);
    }
    return this.trades;
  }

  getPnLSummary(): PnLSummary {
    let totalUnrealizedPnl = 0;
    let totalRealizedPnl = 0;
    let bestPerformer = '';
    let worstPerformer = '';
    let bestPnl = -Infinity;
    let worstPnl = Infinity;

    for (const position of this.positions.values()) {
      totalUnrealizedPnl += position.unrealizedPnl;
      totalRealizedPnl += position.realizedPnl;

      if (position.totalPnl > bestPnl) {
        bestPnl = position.totalPnl;
        bestPerformer = position.symbol;
      }

      if (position.totalPnl < worstPnl) {
        worstPnl = position.totalPnl;
        worstPerformer = position.symbol;
      }
    }

    const totalPnl = totalUnrealizedPnl + totalRealizedPnl;
    const totalPnlPercent = this.calculateTotalPnlPercent();

    return {
      totalUnrealizedPnl,
      totalRealizedPnl,
      totalPnl,
      totalPnlPercent,
      dailyPnl: this.dailyPnL,
      weeklyPnl: this.weeklyPnL,
      monthlyPnl: this.monthlyPnL,
      bestPerformer,
      worstPerformer,
      activePositions: this.positions.size,
      timestamp: Date.now()
    };
  }

  private calculateTotalPnlPercent(): number {
    let totalInvestment = 0;
    let totalPnl = 0;

    for (const position of this.positions.values()) {
      const investment = position.quantity * position.avgEntryPrice;
      totalInvestment += investment;
      totalPnl += position.totalPnl;
    }

    return totalInvestment > 0 ? (totalPnl / totalInvestment) * 100 : 0;
  }

  getDailyPnL(): number {
    return this.dailyPnL;
  }

  getWeeklyPnL(): number {
    return this.weeklyPnL;
  }

  getMonthlyPnL(): number {
    return this.monthlyPnL;
  }

  resetDailyPnL(): void {
    this.dailyPnL = 0;
  }

  resetWeeklyPnL(): void {
    this.weeklyPnL = 0;
  }

  resetMonthlyPnL(): void {
    this.monthlyPnL = 0;
  }

  getPerformanceHistory(days: number = 30): Array<{ date: string; pnl: number }> {
    const history: Array<{ date: string; pnl: number }> = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
      // Fix the date string undefined issue
      const dateStr = date?.toISOString() || new Date().toISOString();
      
      // Calculate PnL for this date (simplified - in real implementation, you'd store historical data)
      const dailyPnl = this.dailyPnL / days; // Simplified calculation
      
      history.push({
        date: dateStr,
        pnl: dailyPnl
      });
    }

    return history;
  }

  getSymbolPerformance(symbol: string): {
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    avgWin: number;
    avgLoss: number;
    totalPnl: number;
  } {
    const symbolTrades = this.trades.filter(t => t.symbol === symbol);
    const winningTrades = symbolTrades.filter(t => {
      // Simplified win/loss calculation
      return t.side === 'SELL'; // Assume SELL trades are wins for simplicity
    });
    const losingTrades = symbolTrades.filter(t => t.side === 'BUY');

    const totalPnl = this.getPosition(symbol, 'LONG')?.totalPnl || 0;

    return {
      totalTrades: symbolTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: symbolTrades.length > 0 ? (winningTrades.length / symbolTrades.length) * 100 : 0,
      avgWin: winningTrades.length > 0 ? totalPnl / winningTrades.length : 0,
      avgLoss: losingTrades.length > 0 ? totalPnl / losingTrades.length : 0,
      totalPnl
    };
  }
} 