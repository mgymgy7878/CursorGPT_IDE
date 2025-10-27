export interface RiskRule {
  id: string;
  name: string;
  type: 'MAX_POSITION_SIZE' | 'PER_SYMBOL_EXPOSURE' | 'GLOBAL_DAILY_LOSS' | 'MAX_ORDER_SIZE' | 'MIN_NOTIONAL';
  symbol?: string;
  value: number;
  enabled: boolean;
  description?: string;
}

export interface Position {
  symbol: string;
  side: 'LONG' | 'SHORT';
  quantity: number;
  avgPrice: number;
  unrealizedPnl: number;
  realizedPnl: number;
  timestamp: number;
}

export interface RiskCheckResult {
  passed: boolean;
  rule: RiskRule;
  currentValue: number;
  limit: number;
  message: string;
}

export class RiskManager {
  private rules: RiskRule[] = [];
  private positions: Map<string, Position> = new Map();
  private dailyPnL = 0;
  private dailyStartTime: number;

  constructor() {
    this.dailyStartTime = this.getStartOfDay();
    this.initializeDefaultRules();
  }

  private initializeDefaultRules(): void {
    this.rules = [
      {
        id: 'max-position-size',
        name: 'Maximum Position Size',
        type: 'MAX_POSITION_SIZE',
        value: 1000, // $1000 max position
        enabled: true,
        description: 'Maximum position size in USD'
      },
      {
        id: 'per-symbol-exposure',
        name: 'Per Symbol Exposure',
        type: 'PER_SYMBOL_EXPOSURE',
        value: 500, // $500 max per symbol
        enabled: true,
        description: 'Maximum exposure per symbol in USD'
      },
      {
        id: 'global-daily-loss',
        name: 'Global Daily Loss Limit',
        type: 'GLOBAL_DAILY_LOSS',
        value: -200, // -$200 daily loss limit
        enabled: true,
        description: 'Maximum daily loss in USD'
      },
      {
        id: 'max-order-size',
        name: 'Maximum Order Size',
        type: 'MAX_ORDER_SIZE',
        value: 100, // $100 max order
        enabled: true,
        description: 'Maximum order size in USD'
      },
      {
        id: 'min-notional',
        name: 'Minimum Notional',
        type: 'MIN_NOTIONAL',
        value: 10, // $10 min notional
        enabled: true,
        description: 'Minimum order notional in USD'
      }
    ];
  }

  addRule(rule: RiskRule): void {
    this.rules.push(rule);
  }

  removeRule(ruleId: string): void {
    this.rules = this.rules.filter(r => r.id !== ruleId);
  }

  updateRule(ruleId: string, updates: Partial<RiskRule>): void {
    const ruleIndex = this.rules.findIndex(r => r.id === ruleId);
    if (ruleIndex !== -1) {
      this.rules[ruleIndex] = {
        ...this.rules[ruleIndex],
        ...updates,
        id: updates.id || this.rules[ruleIndex]?.id || crypto.randomUUID(),
        name: updates.name || this.rules[ruleIndex]?.name || 'Unnamed Rule'
      };
    }
  }

  getRules(): RiskRule[] {
    return this.rules.filter(r => r.enabled);
  }

  updatePosition(symbol: string, side: 'LONG' | 'SHORT', quantity: number, price: number): void {
    const key = `${symbol}_${side}`;
    const existing = this.positions.get(key);

    if (existing) {
      // Update existing position
      const totalQuantity = existing.quantity + quantity;
      const totalValue = (existing.quantity * existing.avgPrice) + (quantity * price);
      const newAvgPrice = totalValue / totalQuantity;

      this.positions.set(key, {
        ...existing,
        quantity: totalQuantity,
        avgPrice: newAvgPrice,
        timestamp: Date.now()
      });
    } else {
      // Create new position
      this.positions.set(key, {
        symbol,
        side,
        quantity,
        avgPrice: price,
        unrealizedPnl: 0,
        realizedPnl: 0,
        timestamp: Date.now()
      });
    }
  }

  updateUnrealizedPnl(symbol: string, currentPrice: number): void {
    for (const [key, position] of this.positions.entries()) {
      if (position.symbol === symbol) {
        const pnl = position.side === 'LONG' 
          ? (currentPrice - position.avgPrice) * position.quantity
          : (position.avgPrice - currentPrice) * position.quantity;
        
        position.unrealizedPnl = pnl;
        this.positions.set(key, position);
      }
    }
  }

  updateDailyPnL(pnl: number): void {
    this.dailyPnL += pnl;
  }

  checkOrderRisk(symbol: string, side: 'BUY' | 'SELL', quantity: number, price: number): RiskCheckResult[] {
    const orderValue = quantity * price;
    const results: RiskCheckResult[] = [];

    for (const rule of this.rules) {
      if (!rule.enabled) continue;

      let passed = true;
      let currentValue = 0;
      let message = '';

      switch (rule.type) {
        case 'MAX_ORDER_SIZE':
          currentValue = orderValue;
          passed = orderValue <= rule.value;
          message = passed ? 'Order size within limits' : `Order size ${orderValue} exceeds limit ${rule.value}`;
          break;

        case 'MIN_NOTIONAL':
          currentValue = orderValue;
          passed = orderValue >= rule.value;
          message = passed ? 'Order notional meets minimum' : `Order notional ${orderValue} below minimum ${rule.value}`;
          break;

        case 'PER_SYMBOL_EXPOSURE':
          const symbolExposure = this.getSymbolExposure(symbol);
          currentValue = symbolExposure + orderValue;
          passed = currentValue <= rule.value;
          message = passed ? 'Symbol exposure within limits' : `Symbol exposure ${currentValue} exceeds limit ${rule.value}`;
          break;

        case 'MAX_POSITION_SIZE':
          const positionSize = this.getPositionSize(symbol, side);
          currentValue = positionSize + orderValue;
          passed = currentValue <= rule.value;
          message = passed ? 'Position size within limits' : `Position size ${currentValue} exceeds limit ${rule.value}`;
          break;

        case 'GLOBAL_DAILY_LOSS':
          currentValue = this.dailyPnL;
          passed = this.dailyPnL >= rule.value;
          message = passed ? 'Daily loss within limits' : `Daily loss ${this.dailyPnL} exceeds limit ${rule.value}`;
          break;
      }

      results.push({
        passed,
        rule,
        currentValue,
        limit: rule.value,
        message
      });
    }

    return results;
  }

  private getSymbolExposure(symbol: string): number {
    let exposure = 0;
    for (const [key, position] of this.positions.entries()) {
      if (position.symbol === symbol) {
        exposure += Math.abs(position.quantity * position.avgPrice);
      }
    }
    return exposure;
  }

  private getPositionSize(symbol: string, side: 'BUY' | 'SELL'): number {
    const positionSide = side === 'BUY' ? 'LONG' : 'SHORT';
    const key = `${symbol}_${positionSide}`;
    const position = this.positions.get(key);
    return position ? Math.abs(position.quantity * position.avgPrice) : 0;
  }

  private getStartOfDay(): number {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  }

  resetDailyPnL(): void {
    this.dailyPnL = 0;
    this.dailyStartTime = this.getStartOfDay();
  }

  getDailyPnL(): number {
    return this.dailyPnL;
  }

  getPositions(): Position[] {
    return Array.from(this.positions.values());
  }

  getRiskSummary(): {
    totalExposure: number;
    dailyPnL: number;
    activePositions: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  } {
    let totalExposure = 0;
    for (const position of this.positions.values()) {
      totalExposure += Math.abs(position.quantity * position.avgPrice);
    }

    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (totalExposure > 2000 || this.dailyPnL < -100) {
      riskLevel = 'HIGH';
    } else if (totalExposure > 1000 || this.dailyPnL < -50) {
      riskLevel = 'MEDIUM';
    }

    return {
      totalExposure,
      dailyPnL: this.dailyPnL,
      activePositions: this.positions.size,
      riskLevel
    };
  }
} 