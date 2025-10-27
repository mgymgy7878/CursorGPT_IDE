import { EventEmitter } from "events";
import type { 
  Order, Fill, Position, Account, RiskConfig, 
  OrderType, OrderSide, OrderStatus, TIF 
} from "./types";
import { cfg, roundTick } from "./config";
import type { OrderBookSide, MatchFill, Side } from "./matching/engine";
import { matchMarket, matchLimit } from "./matching/engine";
import { paperFee, paperSlippage, paperRejects } from "./metrics";

export class PaperBroker extends EventEmitter {
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
  private riskConfig: RiskConfig = {
    maxPositionSize: 1000,
    maxDailyLoss: 500,
    maxLeverage: 10,
    symbolAllowlist: ['BTCUSDT', 'ETHUSDT', 'ADAUSDT'],
    makerFeeBps: 10, // 0.1%
    takerFeeBps: 15  // 0.15%
  };
  private currentPrice = 50000;
  private orderIdCounter = 0;
  private fillIdCounter = 0;

  // L2 yoksa sentetik book: last fiyat etrafında bantlar
  private synthOpp(last: number, side: OrderSide): OrderBookSide {
    const lvls = [];
    const base = last;
    const step = Math.max(cfg.tickSize, base * (cfg.maxSlippageBps / 1e4) / 5);
    
    for (let i = 0; i < 5; i++) {
      const price = side === 'buy' ? roundTick(base + step * i) : roundTick(base - step * i);
      const qty = cfg.lotSize * (i + 1) * 5; // kademede artan miktar
      lvls.push({ price, qty });
    }
    
    // Karşı tarafın book'u: buy -> asks (yüksek fiyat), sell -> bids (düşük fiyat)
    return { levels: side === 'buy' ? lvls : lvls.sort((a, b) => b.price - a.price) };
  }

  private applyFee(notional: number, kind: 'maker' | 'taker'): number {
    const bps = (kind === 'maker') ? cfg.makerBps : cfg.takerBps;
    const fee = (notional * bps) / 1e4;
    paperFee.inc({ type: kind }, fee);
    return fee;
  }

  private settleFillsAndPositions(order: Order, fills: MatchFill[], fee: number): void {
    fills.forEach(fill => {
      const fillRecord: Fill = {
        id: this.generateFillId(),
        orderId: order.id,
        symbol: order.symbol,
        side: order.side,
        quantity: fill.qty,
        price: fill.price,
        fee: fee / fills.length, // Fee'yi fill'lere böl
        feeBps: this.riskConfig.takerFeeBps,
        timestamp: Date.now()
      };
      
      this.fills.push(fillRecord);
      this.updatePosition(order.symbol, order.side, fill.qty, fill.price);
    });
    
    this.account.totalFees += fee;
    this.updateAccount();
  }

  private registerStopWatcher(order: Order): void {
    // Stop emirleri için basit watcher (gerçek implementasyonda timer kullanılır)
    // Bu örnekte processTick'te kontrol edilir
  }

  private updatePosition(symbol: string, side: OrderSide, quantity: number, price: number, fee?: number): void {
    let position = this.positions.find(p => p.symbol === symbol);
    
    if (!position) {
      position = {
        symbol,
        side: side === 'buy' ? 'long' : 'short',
        quantity: 0,
        averagePrice: 0,
        unrealizedPnL: 0,
        realizedPnL: 0,
        totalFees: 0,
        lastUpdate: Date.now()
      };
      this.positions.push(position);
    }

    if (!position) return; // Type guard

    const oldValue = position.quantity * position.averagePrice;
    const newValue = quantity * price;
    const totalQuantity = position.quantity + quantity;
    
    if (totalQuantity === 0) {
      // Position closed
      this.positions = this.positions.filter(p => p.symbol !== symbol);
    } else {
      position.quantity = totalQuantity;
      position.averagePrice = (oldValue + newValue) / totalQuantity;
      position.lastUpdate = Date.now();
    }
  }

  constructor(config?: Partial<RiskConfig>) {
    super();
    if (config) {
      this.riskConfig = { ...this.riskConfig, ...config };
    }
  }

  private generateOrderId(): string {
    return `order_${Date.now()}_${++this.orderIdCounter}`;
  }

  private generateFillId(): string {
    return `fill_${Date.now()}_${++this.fillIdCounter}`;
  }

  private validateOrder(orderData: Partial<Order>): { valid: boolean; error?: string } {
    const { symbol, side, type, quantity, price, stopPrice, tif } = orderData;

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
    const positionValue = quantity * (price || this.currentPrice);
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
      const currentValue = pos.quantity * this.currentPrice;
      const positionValue = pos.quantity * pos.averagePrice;
      unrealizedPnL += pos.side === 'long' ? currentValue - positionValue : positionValue - currentValue;
    });

    this.account.unrealizedPnL = unrealizedPnL;
    this.account.equity = this.account.balance + unrealizedPnL - this.account.feesAccrued;
    this.account.totalPnL = this.account.realizedPnL + unrealizedPnL;
    this.account.updatedAt = Date.now();
  }

  private processMarketOrder(order: Order, currentPrice: number): Fill[] {
    const fills: Fill[] = [];
    const notional = order.quantity * currentPrice;
    const fee = this.calculateFee(notional, false); // Market orders are taker

    const fill: Fill = {
      id: this.generateFillId(),
      orderId: order.id,
      symbol: order.symbol,
      side: order.side,
      quantity: order.quantity,
      price: currentPrice,
      fee,
      feeBps: this.riskConfig.takerFeeBps,
      timestamp: Date.now()
    };

    fills.push(fill);
    this.fills.push(fill);

    // Update order
    order.status = 'filled';
    order.filledQuantity = order.quantity;
    order.averagePrice = currentPrice;
    order.fee = fee;
    order.feeBps = this.riskConfig.takerFeeBps;
    order.updatedAt = Date.now();

    // Update account
    this.account.totalFees += fee;
    this.account.feesAccrued += fee;

    // Update positions
    this.updatePosition(order.symbol, order.side, order.quantity, currentPrice, fee);

    return fills;
  }

  private processLimitOrder(order: Order, currentPrice: number): Fill[] {
    const fills: Fill[] = [];
    
    // Check if limit order can be filled
    const canFill = order.side === 'buy' ? currentPrice <= order.price! : currentPrice >= order.price!;
    
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

  private processStopOrder(order: Order, currentPrice: number): Fill[] {
    const fills: Fill[] = [];
    
    // Check if stop is triggered
    const stopTriggered = order.side === 'buy' ? currentPrice >= order.stopPrice! : currentPrice <= order.stopPrice!;
    
    if (stopTriggered) {
      if (order.type === 'STOP_MARKET') {
        // Execute as market order
        return this.processMarketOrder(order, currentPrice);
      } else if (order.type === 'STOP_LIMIT') {
        // Execute as limit order at user's limit price
        return this.processLimitOrder(order, order.price!);
      }
    }

    return fills;
  }



  placeOrder(orderData: Partial<Order>): Order {
    const validation = this.validateOrder(orderData);
    if (!validation.valid) {
      paperRejects.inc({ reason: 'validation' });
      throw new Error(validation.error);
    }

    const order: Order = {
      id: this.generateOrderId(),
      symbol: orderData.symbol!.toUpperCase(),
      side: orderData.side!,
      type: orderData.type!,
      quantity: orderData.quantity!,
      price: orderData.price,
      stopPrice: orderData.stopPrice,
      tif: orderData.tif || 'GTC',
      status: 'pending',
      filledQuantity: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.orders.push(order);

    // Matching engine ile işle
    try {
      const last = this.currentPrice;
      if (!last || last <= 0) {
        paperRejects.inc({ reason: 'no_price' });
        throw new Error('NO_PRICE');
      }

      // Opp tarafı kur (gerçek L2 varsa onu kullan, yoksa sentetik)
      const opp = this.synthOpp(last, order.side);

      if (order.type === 'MARKET') {
        const res = matchMarket(order.quantity, order.side.toUpperCase() as Side, opp, cfg.maxSlippageBps);
        if (res.filledQty <= 0) {
          paperRejects.inc({ reason: 'no_liquidity' });
          order.status = 'cancelled';
          order.cancelledAt = Date.now();
          order.updatedAt = Date.now();
        } else {
          const notional = res.filledQty * res.avgPrice;
          const fee = this.applyFee(notional, 'taker');
          const firstLevel = opp.levels[0];
          const slipBps = firstLevel ? Math.abs((res.avgPrice - firstLevel.price) / firstLevel.price) * 1e4 : 0;
          paperSlippage.inc({ symbol: order.symbol }, slipBps);
          
          this.settleFillsAndPositions(order, res.fills, fee);
          order.filledQuantity = res.filledQty;
          order.status = res.remaining > 0 ? 'partially_filled' : 'filled';
          order.updatedAt = Date.now();
        }
      } else if (order.type === 'LIMIT') {
        const res = matchLimit(order.price!, order.quantity, order.side.toUpperCase() as Side, opp, order.tif as any);
        if (res.filledQty > 0) {
          const notional = res.filledQty * res.avgPrice;
          const feeTaker = this.applyFee(notional, 'taker');
          const firstLevel = opp.levels[0];
          const slipBps = firstLevel ? Math.abs((res.avgPrice - firstLevel.price) / firstLevel.price) * 1e4 : 0;
          paperSlippage.inc({ symbol: order.symbol }, slipBps);
          
          this.settleFillsAndPositions(order, res.fills, feeTaker);
          order.filledQuantity = res.filledQty;
        }
        
        if (res.remaining > 0 && order.tif === 'GTC') {
          // Kalanı deftere maker olarak yaz
          order.quantity = res.remaining;
          order.status = 'pending';
        } else if (res.remaining === 0) {
          order.status = 'filled';
        } else {
          order.status = 'cancelled'; // IOC kalan
          order.cancelledAt = Date.now();
        }
        order.updatedAt = Date.now();
      } else if (order.type === 'STOP_MARKET' || order.type === 'STOP_LIMIT') {
        // Stop emirleri için watcher kaydet
        this.registerStopWatcher(order);
        order.status = 'pending';
      } else {
        paperRejects.inc({ reason: 'unknown_type' });
        throw new Error('UNKNOWN_TYPE');
      }
    } catch (error) {
      paperRejects.inc({ reason: 'processing_error' });
      order.status = 'cancelled';
      order.cancelledAt = Date.now();
      order.updatedAt = Date.now();
    }

    this.emit('order_placed', { order, timestamp: Date.now() });
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

    this.emit('order_cancelled', { order, timestamp: Date.now() });
    return true;
  }

  processTick(symbol: string, price: number): void {
    this.currentPrice = price;
    
    // Process pending orders
    const pendingOrders = this.orders.filter(o => o.status === 'pending' && o.symbol === symbol);
    
    pendingOrders.forEach(order => {
      let fills: Fill[] = [];
      
      switch (order.type) {
        case 'LIMIT':
          fills = this.processLimitOrder(order, price);
          break;
        case 'STOP_MARKET':
        case 'STOP_LIMIT':
          fills = this.processStopOrder(order, price);
          break;
      }

      if (fills.length > 0) {
        fills.forEach(fill => {
          this.emit('order_filled', { order, fill, timestamp: Date.now() });
        });
        
        if (order.filledQuantity < order.quantity && order.tif === 'IOC') {
          // Partial fill for IOC, cancel remaining
          order.status = 'partially_filled';
          order.cancelledAt = Date.now();
          order.updatedAt = Date.now();
          this.emit('partial_fill', { order, fills, timestamp: Date.now() });
        }
      }
    });

    // Update positions and account
    this.updateAccount();
    this.emit('position_update', { positions: this.positions, timestamp: Date.now() });
  }

  getOrders(): Order[] {
    return [...this.orders];
  }

  getFills(): Fill[] {
    return [...this.fills];
  }

  getPositions(): Position[] {
    return [...this.positions];
  }

  getAccount(): Account {
    return { ...this.account };
  }

  getCurrentPrice(): number {
    return this.currentPrice;
  }

  getRiskConfig(): RiskConfig {
    return { ...this.riskConfig };
  }

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
} 