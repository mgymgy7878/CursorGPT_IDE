import { EventEmitter } from "events";
// import { PaperBroker } from "@spark/paper-broker";

interface Order { 
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'MARKET' | 'LIMIT' | 'STOP_MARKET' | 'STOP_LIMIT';
  quantity: number;
  price?: number;
  stopPrice?: number;
  tif?: 'GTC' | 'IOC';
  status: 'pending' | 'filled' | 'partially_filled' | 'cancelled' | 'rejected';
  filledQuantity: number;
  averagePrice?: number;
  fee?: number;
  feeBps?: number;
  createdAt: number;
  updatedAt: number;
  cancelledAt?: number;
}

interface Fill { 
  id: string;
  orderId: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  fee: number;
  feeBps: number;
  timestamp: number;
}

interface Position { 
  symbol: string;
  side: 'long' | 'short';
  quantity: number;
  averagePrice: number;
  unrealizedPnL: number;
  realizedPnL: number;
  totalFees: number;
  lastUpdate: number;
}

interface Account { 
  balance: number;
  equity: number;
  realizedPnL: number;
  unrealizedPnL: number;
  totalPnL: number;
  dailyPnL: number;
  totalFees: number;
  feesAccrued: number;
  updatedAt: number;
}

class MockPaperBroker extends EventEmitter {
  private orders: Order[] = [];
  private fills: Fill[] = [];
  private positions: Position[] = [];
  private account: Account = {
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
  private feedInterval?: NodeJS.Timeout;
  private mockPrice = 50000;
  private orderIdCounter = 0;
  private fillIdCounter = 0;

  // Risk configuration
  private riskConfig = {
    maxPositionSize: parseFloat(process.env.PAPER_MAX_POSITION_SIZE || '1000'),
    maxDailyLoss: parseFloat(process.env.PAPER_MAX_DAILY_LOSS || '500'),
    maxLeverage: parseFloat(process.env.PAPER_MAX_LEVERAGE || '10'),
    symbolAllowlist: (process.env.PAPER_SYMBOL_ALLOWLIST || 'BTCUSDT,ETHUSDT,ADAUSDT').split(','),
    makerFeeBps: parseFloat(process.env.PAPER_MAKER_FEE_BPS || '10'),
    takerFeeBps: parseFloat(process.env.PAPER_TAKER_FEE_BPS || '15')
  };

  private generateOrderId(): string {
    return `order_${Date.now()}_${++this.orderIdCounter}`;
  }

  private generateFillId(): string {
    return `fill_${Date.now()}_${++this.fillIdCounter}`;
  }

  private validateOrder(orderData: any): { valid: boolean; error?: string } {
    const { symbol, side, type, quantity, price, stopPrice } = orderData;

    // Symbol validation
    if (!symbol || !this.riskConfig.symbolAllowlist.includes(symbol.toUpperCase())) {
      return { valid: false, error: `Symbol ${symbol} not allowed` };
    }

    // Quantity validation
    if (!quantity || quantity <= 0) {
      return { valid: false, error: 'Invalid quantity' };
    }

    // Price validation for LIMIT orders
    if (type === 'LIMIT' || type === 'STOP_LIMIT') {
      if (!price || price <= 0) {
        return { valid: false, error: 'Price required for LIMIT orders' };
      }
    }

    // Stop price validation for STOP orders
    if (type === 'STOP_MARKET' || type === 'STOP_LIMIT') {
      if (!stopPrice || stopPrice <= 0) {
        return { valid: false, error: 'Stop price required for STOP orders' };
      }
    }

    // Leverage validation
    const positionValue = quantity * (price || this.mockPrice);
    const leverage = positionValue / this.account.balance;
    if (leverage > this.riskConfig.maxLeverage) {
      return { valid: false, error: `Leverage ${leverage.toFixed(2)} exceeds max ${this.riskConfig.maxLeverage}` };
    }

    return { valid: true };
  }

  private calculateFee(notional: number, isMaker: boolean = false): number {
    const bps = isMaker ? this.riskConfig.makerFeeBps : this.riskConfig.takerFeeBps;
    return (notional * bps) / 10000;
  }

  private updateAccount(): void {
    // Calculate unrealized PnL
    let unrealizedPnL = 0;
    this.positions.forEach(pos => {
      const currentValue = pos.quantity * this.mockPrice;
      const positionValue = pos.quantity * pos.averagePrice;
      unrealizedPnL += pos.side === 'long' ? currentValue - positionValue : positionValue - currentValue;
    });

    this.account.unrealizedPnL = unrealizedPnL;
    this.account.equity = this.account.balance + unrealizedPnL - this.account.feesAccrued;
    this.account.totalPnL = this.account.realizedPnL + unrealizedPnL;
    this.account.updatedAt = Date.now();
  }

  private processMarketOrder(order: Order): Fill[] {
    const fills: Fill[] = [];
    const notional = order.quantity * this.mockPrice;
    const fee = this.calculateFee(notional, false); // Market orders are taker

    const fill: Fill = {
      id: this.generateFillId(),
      orderId: order.id,
      symbol: order.symbol,
      side: order.side,
      quantity: order.quantity,
      price: this.mockPrice,
      fee,
      feeBps: this.riskConfig.takerFeeBps,
      timestamp: Date.now()
    };

    fills.push(fill);
    this.fills.push(fill);

    // Update order
    order.status = 'filled';
    order.filledQuantity = order.quantity;
    order.averagePrice = this.mockPrice;
    order.fee = fee;
    order.feeBps = this.riskConfig.takerFeeBps;
    order.updatedAt = Date.now();

    // Update account
    this.account.totalFees += fee;
    this.account.feesAccrued += fee;

    // Update positions
    this.updatePosition(order.symbol, order.side, order.quantity, this.mockPrice, fee);

    return fills;
  }

  private processLimitOrder(order: Order): Fill[] {
    const fills: Fill[] = [];
    
    // Check if limit order can be filled
    const canFill = order.side === 'buy' ? this.mockPrice <= order.price! : this.mockPrice >= order.price!;
    
    if (canFill) {
      const notional = order.quantity * order.price!;
      const fee = this.calculateFee(notional, true); // Limit orders are maker

      const fill: Fill = {
        id: this.generateFillId(),
        orderId: order.id,
        symbol: order.symbol,
        side: order.side,
        quantity: order.quantity,
        price: order.price!,
        fee,
        feeBps: this.riskConfig.makerFeeBps,
        timestamp: Date.now()
      };

      fills.push(fill);
      this.fills.push(fill);

      // Update order
      order.status = 'filled';
      order.filledQuantity = order.quantity;
      order.averagePrice = order.price!;
      order.fee = fee;
      order.feeBps = this.riskConfig.makerFeeBps;
      order.updatedAt = Date.now();

      // Update account
      this.account.totalFees += fee;
      this.account.feesAccrued += fee;

      // Update positions
      this.updatePosition(order.symbol, order.side, order.quantity, order.price!, fee);
    }

    return fills;
  }

  private processStopOrder(order: Order): Fill[] {
    const fills: Fill[] = [];
    
    // Check if stop is triggered
    const stopTriggered = order.side === 'buy' ? this.mockPrice >= order.stopPrice! : this.mockPrice <= order.stopPrice!;
    
    if (stopTriggered) {
      if (order.type === 'STOP_MARKET') {
        // Execute as market order
        return this.processMarketOrder(order);
      } else if (order.type === 'STOP_LIMIT') {
        // Execute as limit order at user's limit price
        return this.processLimitOrder(order);
      }
    }

    return fills;
  }

  private updatePosition(symbol: string, side: 'buy' | 'sell', quantity: number, price: number, fee: number): void {
    const existingPosition = this.positions.find(p => p.symbol === symbol);
    
    if (existingPosition) {
      // Update existing position
      const totalQuantity = existingPosition.quantity + (side === 'buy' ? quantity : -quantity);
      const totalValue = existingPosition.quantity * existingPosition.averagePrice + quantity * price;
      
      if (totalQuantity === 0) {
        // Position closed
        const realizedPnL = side === 'buy' ? 
          (existingPosition.averagePrice - price) * quantity : 
          (price - existingPosition.averagePrice) * quantity;
        
        this.account.realizedPnL += realizedPnL;
        this.positions = this.positions.filter(p => p.symbol !== symbol);
      } else {
        // Update position
        existingPosition.quantity = totalQuantity;
        existingPosition.averagePrice = totalValue / Math.abs(totalQuantity);
        existingPosition.side = totalQuantity > 0 ? 'long' : 'short';
        existingPosition.totalFees += fee;
        existingPosition.lastUpdate = Date.now();
      }
    } else {
      // Create new position
      const newPosition: Position = {
        symbol,
        side: side === 'buy' ? 'long' : 'short',
        quantity: Math.abs(quantity),
        averagePrice: price,
        unrealizedPnL: 0,
        realizedPnL: 0,
        totalFees: fee,
        lastUpdate: Date.now()
      };
      this.positions.push(newPosition);
    }

    this.updateAccount();
  }

  placeOrder(orderData: any): Order {
    const validation = this.validateOrder(orderData);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const order: Order = {
      id: this.generateOrderId(),
      symbol: orderData.symbol.toUpperCase(),
      side: orderData.side,
      type: orderData.type,
      quantity: orderData.quantity,
      price: orderData.price,
      stopPrice: orderData.stopPrice,
      tif: orderData.tif || 'GTC',
      status: 'pending',
      filledQuantity: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.orders.push(order);

    // Try to fill immediately for MARKET orders or IOC orders
    if (order.type === 'MARKET' || order.tif === 'IOC') {
      const fills = this.processMarketOrder(order);
      
      if (order.tif === 'IOC' && fills.length === 0) {
        // IOC order not filled, cancel remaining
        order.status = 'cancelled';
        order.cancelledAt = Date.now();
        order.updatedAt = Date.now();
      } else if (order.tif === 'IOC' && fills.length > 0 && order.filledQuantity < order.quantity) {
        // Partial fill for IOC, cancel remaining
        order.status = 'partially_filled';
        order.cancelledAt = Date.now();
        order.updatedAt = Date.now();
      }
    }

    return order;
  }

  cancelOrder(orderId: string): boolean {
    const order = this.orders.find(o => o.id === orderId);
    if (!order || order.status !== 'pending') {
      return false;
    }

    order.status = 'cancelled';
    order.cancelledAt = Date.now();
    order.updatedAt = Date.now();

    return true;
  }

  getOrders(): Order[] { return this.orders; }
  getFills(): Fill[] { return this.fills; }
  getPositions(): Position[] { return this.positions; }
  getAccount(): Account { return { ...this.account }; }
  getRiskConfig() { return { ...this.riskConfig }; }
  getCurrentPrice(): number { return this.mockPrice; }

  reset(): void {
    this.orders = [];
    this.fills = [];
    this.positions = [];
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
    this.orderIdCounter = 0;
    this.fillIdCounter = 0;
  }

  startMockFeed(symbol: string = 'BTCUSDT'): void {
    this.feedInterval = setInterval(() => {
      // Simulate price movement
      this.mockPrice += (Math.random() - 0.5) * 100;
      this.mockPrice = Math.max(1000, Math.min(100000, this.mockPrice));
      
      // Process pending orders
      const pendingOrders = this.orders.filter(o => o.status === 'pending' && o.symbol === symbol);
      
      pendingOrders.forEach(order => {
        let fills: Fill[] = [];
        
        switch (order.type) {
          case 'LIMIT':
            fills = this.processLimitOrder(order);
            break;
          case 'STOP_MARKET':
          case 'STOP_LIMIT':
            fills = this.processStopOrder(order);
            break;
        }

        if (fills.length > 0) {
          if (order.filledQuantity < order.quantity && order.tif === 'IOC') {
            // Partial fill for IOC, cancel remaining
            order.status = 'partially_filled';
            order.cancelledAt = Date.now();
            order.updatedAt = Date.now();
          }
        }
      });

      // Update positions and account
      this.updateAccount();
    }, 1000);
  }

  stopFeed(): void {
    if (this.feedInterval) {
      clearInterval(this.feedInterval);
      this.feedInterval = undefined;
    }
  }

  executeRSIStrategy(params: any) {
    const { symbol, quantity } = params;
    const side = Math.floor(Date.now() / 5000) % 2 === 0 ? 'buy' : 'sell'; // Alternates buy/sell every 5s
    try {
      const order = this.placeOrder({ symbol, side, type: 'MARKET', quantity });
      return { success: true, order };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
}

export const paperEngine = new MockPaperBroker(); 