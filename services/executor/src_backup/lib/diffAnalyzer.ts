export interface OrderExecution {
  orderId: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  type: string;
  quantity: string;
  price: string;
  executedQty: string;
  cummulativeQuoteQty: string;
  status: string;
  timeInForce: string;
  time: number;
  updateTime: number;
  fills?: Array<{
    price: string;
    qty: string;
    commission: string;
    commissionAsset: string;
  }>;
}

export interface DiffReport {
  timestamp: number;
  testRunId: string;
  paperOrders: OrderExecution[];
  testnetOrders: OrderExecution[];
  comparison: {
    orderCount: {
      paper: number;
      testnet: number;
      diff: number;
    };
    totalValue: {
      paper: number;
      testnet: number;
      diff: number;
      diffPercent: number;
    };
    executionTime: {
      paper: number;
      testnet: number;
      diff: number;
    };
    fillRatio: {
      paper: number;
      testnet: number;
      diff: number;
    };
    slippage: {
      paper: number;
      testnet: number;
      diff: number;
    };
  };
  summary: {
    totalOrders: number;
    successfulOrders: number;
    failedOrders: number;
    averageExecutionTime: number;
    totalSlippage: number;
    totalFees: number;
  };
}

export class DiffAnalyzer {
  private paperOrders: OrderExecution[] = [];
  private testnetOrders: OrderExecution[] = [];

  addPaperOrder(order: OrderExecution): void {
    this.paperOrders.push(order);
  }

  addTestnetOrder(order: OrderExecution): void {
    this.testnetOrders.push(order);
  }

  generateReport(testRunId: string): DiffReport {
    const timestamp = Date.now();
    
    const comparison = this.calculateComparison();
    const summary = this.calculateSummary();

    return {
      timestamp,
      testRunId,
      paperOrders: this.paperOrders,
      testnetOrders: this.testnetOrders,
      comparison,
      summary
    };
  }

  private calculateComparison() {
    const paperCount = this.paperOrders.length;
    const testnetCount = this.testnetOrders.length;
    
    const paperValue = this.calculateTotalValue(this.paperOrders);
    const testnetValue = this.calculateTotalValue(this.testnetOrders);
    
    const paperTime = this.calculateAverageExecutionTime(this.paperOrders);
    const testnetTime = this.calculateAverageExecutionTime(this.testnetOrders);
    
    const paperFillRatio = this.calculateFillRatio(this.paperOrders);
    const testnetFillRatio = this.calculateFillRatio(this.testnetOrders);
    
    const paperSlippage = this.calculateAverageSlippage(this.paperOrders);
    const testnetSlippage = this.calculateAverageSlippage(this.testnetOrders);

    return {
      orderCount: {
        paper: paperCount,
        testnet: testnetCount,
        diff: testnetCount - paperCount
      },
      totalValue: {
        paper: paperValue,
        testnet: testnetValue,
        diff: testnetValue - paperValue,
        diffPercent: paperValue > 0 ? ((testnetValue - paperValue) / paperValue) * 100 : 0
      },
      executionTime: {
        paper: paperTime,
        testnet: testnetTime,
        diff: testnetTime - paperTime
      },
      fillRatio: {
        paper: paperFillRatio,
        testnet: testnetFillRatio,
        diff: testnetFillRatio - paperFillRatio
      },
      slippage: {
        paper: paperSlippage,
        testnet: testnetSlippage,
        diff: testnetSlippage - paperSlippage
      }
    };
  }

  private calculateSummary() {
    const allOrders = [...this.paperOrders, ...this.testnetOrders];
    const totalOrders = allOrders.length;
    const successfulOrders = allOrders.filter(o => o.status === 'FILLED').length;
    const failedOrders = totalOrders - successfulOrders;
    
    const averageExecutionTime = this.calculateAverageExecutionTime(allOrders);
    const totalSlippage = this.calculateTotalSlippage(allOrders);
    const totalFees = this.calculateTotalFees(allOrders);

    return {
      totalOrders,
      successfulOrders,
      failedOrders,
      averageExecutionTime,
      totalSlippage,
      totalFees
    };
  }

  private calculateTotalValue(orders: OrderExecution[]): number {
    return orders.reduce((sum, order) => {
      return sum + Number(order.cummulativeQuoteQty || 0);
    }, 0);
  }

  private calculateAverageExecutionTime(orders: OrderExecution[]): number {
    if (orders.length === 0) return 0;
    
    const totalTime = orders.reduce((sum, order) => {
      return sum + (order.updateTime - order.time);
    }, 0);
    
    return totalTime / orders.length;
  }

  private calculateFillRatio(orders: OrderExecution[]): number {
    if (orders.length === 0) return 0;
    
    const totalFillRatio = orders.reduce((sum, order) => {
      const requested = Number(order.quantity);
      const executed = Number(order.executedQty || 0);
      return sum + (requested > 0 ? executed / requested : 0);
    }, 0);
    
    return totalFillRatio / orders.length;
  }

  private calculateAverageSlippage(orders: OrderExecution[]): number {
    if (orders.length === 0) return 0;
    
    const totalSlippage = orders.reduce((sum, order) => {
      if (!order.fills || order.fills.length === 0) return sum;
      
      const requestedPrice = Number(order.price);
      const avgFillPrice = order.fills.reduce((fillSum, fill) => {
        return fillSum + Number(fill.price);
      }, 0) / order.fills.length;
      
      return sum + Math.abs(avgFillPrice - requestedPrice) / requestedPrice;
    }, 0);
    
    return totalSlippage / orders.length;
  }

  private calculateTotalSlippage(orders: OrderExecution[]): number {
    return orders.reduce((sum, order) => {
      if (!order.fills || order.fills.length === 0) return sum;
      
      const requestedPrice = Number(order.price);
      const avgFillPrice = order.fills.reduce((fillSum, fill) => {
        return fillSum + Number(fill.price);
      }, 0) / order.fills.length;
      
      return sum + Math.abs(avgFillPrice - requestedPrice);
    }, 0);
  }

  private calculateTotalFees(orders: OrderExecution[]): number {
    return orders.reduce((sum, order) => {
      if (!order.fills) return sum;
      
      return sum + order.fills.reduce((fillSum, fill) => {
        return fillSum + Number(fill.commission || 0);
      }, 0);
    }, 0);
  }

  clear(): void {
    this.paperOrders = [];
    this.testnetOrders = [];
  }
} 