import { EventEmitter } from "events";
import type { TradingSignal, SignalProcessingResult, SignalProcessingConfig, ExecutionOrder, ExecutionResult, PortfolioStatus } from "./types.js";
import { SignalStatus } from "./types.js";

export class SignalExecutor extends EventEmitter {
  private activeSignals: Map<string, TradingSignal> = new Map();
  private isRunning: boolean = false;
  private executionHistory: SignalProcessingResult[] = [];
  private maxHistorySize: number = 1000;

  constructor() {
    super();
  }

  async start(): Promise<void> {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.emit('executor:started');
    console.log('🚀 Signal Executor başlatıldı');
  }

  async stop(): Promise<void> {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    this.emit('executor:stopped');
    console.log('🛑 Signal Executor durduruldu');
  }

  async execute(signal: TradingSignal): Promise<SignalProcessingResult> {
    const startTime = Date.now();
    
    try {
      if (!this.isRunning) {
        throw new Error('Executor is not running');
      }

      // Signal'i active listesine ekle
      this.activeSignals.set(signal.id, signal);
      this.emit('signal:processing_started', signal);

      console.log(`⚡ Executing signal: ${signal.id} (${signal.action} ${signal.symbol})`);

      // Signal'i işleme al
      const result = await this.processSignal(signal);
      
      // Execution time hesapla
      const executionTime = Date.now() - startTime;
      
      const processingResult: SignalProcessingResult = {
        signalId: signal.id,
        success: result.success,
        status: result.success ? SignalStatus.EXECUTED : SignalStatus.FAILED,
        executionTime,
        timestamp: new Date(),
        orderId: result.orderId,
        error: result.error,
        metadata: result.metadata
      };

      // Sonucu kaydet
      this.recordExecution(processingResult);
      
      // Active listesinden çıkar
      this.activeSignals.delete(signal.id);
      
      // Event emit
      if (result.success) {
        this.emit('signal:executed', processingResult);
        console.log(`✅ Signal executed: ${signal.id} (${executionTime}ms)`);
      } else {
        this.emit('signal:failed', processingResult);
        console.log(`❌ Signal failed: ${signal.id} - ${result.error}`);
      }

      return processingResult;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = (error as Error).message;
      
      const processingResult: SignalProcessingResult = {
        signalId: signal.id,
        success: false,
        status: SignalStatus.FAILED,
        executionTime,
        timestamp: new Date(),
        error: errorMessage,
        metadata: { originalError: error }
      };

      this.recordExecution(processingResult);
      this.activeSignals.delete(signal.id);
      
      this.emit('signal:failed', processingResult);
      console.error(`💥 Signal execution error: ${signal.id} - ${errorMessage}`);
      
      return processingResult;
    }
  }

  private async processSignal(signal: TradingSignal): Promise<{
    success: boolean;
    orderId?: string;
    error?: string;
    metadata?: Record<string, any>;
  }> {
    try {
      // Signal action'ına göre işlem yap
      switch (signal.action) {
        case 'buy':
          return await this.executeBuyOrder(signal);
        case 'sell':
          return await this.executeSellOrder(signal);
        case 'close':
          return await this.executeCloseOrder(signal);
        case 'hold':
          return await this.executeHoldAction(signal);
        default:
          throw new Error(`Unknown action: ${signal.action}`);
      }
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  private async executeBuyOrder(signal: TradingSignal): Promise<{
    success: boolean;
    orderId?: string;
    error?: string;
    metadata?: Record<string, any>;
  }> {
    try {
      // Order oluştur
      const order: ExecutionOrder = {
        symbol: signal.symbol,
        side: 'buy',
        quantity: this.calculateQuantity(signal),
        orderType: 'market',
        metadata: {
          signalId: signal.id,
          confidence: signal.confidence,
          strategyId: signal.strategyId
        }
      };

      // Order'ı gönder (şimdilik mock)
      const result = await this.sendOrder(order);
      
      return {
        success: result.status === 'filled',
        orderId: result.orderId,
        metadata: {
          orderType: order.orderType,
          quantity: order.quantity,
          price: result.price
        }
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  private async executeSellOrder(signal: TradingSignal): Promise<{
    success: boolean;
    orderId?: string;
    error?: string;
    metadata?: Record<string, any>;
  }> {
    try {
      const order: ExecutionOrder = {
        symbol: signal.symbol,
        side: 'sell',
        quantity: this.calculateQuantity(signal),
        orderType: 'market',
        metadata: {
          signalId: signal.id,
          confidence: signal.confidence,
          strategyId: signal.strategyId
        }
      };

      const result = await this.sendOrder(order);
      
      return {
        success: result.status === 'filled',
        orderId: result.orderId,
        metadata: {
          orderType: order.orderType,
          quantity: order.quantity,
          price: result.price
        }
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  private async executeCloseOrder(signal: TradingSignal): Promise<{
    success: boolean;
    orderId?: string;
    error?: string;
    metadata?: Record<string, any>;
  }> {
    try {
      // Mevcut pozisyonu kapat
      const order: ExecutionOrder = {
        symbol: signal.symbol,
        side: 'sell', // Pozisyonu kapatmak için
        quantity: await this.getPositionSize(signal.symbol),
        orderType: 'market',
        reduceOnly: true,
        metadata: {
          signalId: signal.id,
          action: 'close_position'
        }
      };

      const result = await this.sendOrder(order);
      
      return {
        success: result.status === 'filled',
        orderId: result.orderId,
        metadata: {
          orderType: order.orderType,
          quantity: order.quantity,
          price: result.price
        }
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  private async executeHoldAction(signal: TradingSignal): Promise<{
    success: boolean;
    orderId?: string;
    error?: string;
    metadata?: Record<string, any>;
  }> {
    // Hold action için sadece log
    console.log(`⏸️ Hold action for ${signal.symbol}: ${signal.reasoning}`);
    
    return {
      success: true,
      metadata: {
        action: 'hold',
        reasoning: signal.reasoning
      }
    };
  }

  private calculateQuantity(signal: TradingSignal): number {
    // Basit quantity hesaplama - geliştirilecek
    const baseQuantity = 0.01; // BTC için
    const confidenceMultiplier = signal.confidence;
    const riskMultiplier = signal.riskLevel === 'low' ? 0.5 : 
                          signal.riskLevel === 'medium' ? 1.0 : 1.5;
    
    return baseQuantity * confidenceMultiplier * riskMultiplier;
  }

  private async getPositionSize(symbol: string): Promise<number> {
    // Mock position size - gerçek implementasyonda portfolio'dan alınacak
    return 0.01;
  }

  private async sendOrder(order: ExecutionOrder): Promise<ExecutionResult> {
    // Mock order execution - gerçek implementasyonda exchange API'si kullanılacak
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const mockPrice = 50000; // Mock price
    
    // Simüle edilmiş execution delay
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
    
    return {
      orderId,
      symbol: order.symbol,
      side: order.side,
      quantity: order.quantity,
      price: mockPrice,
      status: 'filled',
      timestamp: new Date(),
      fees: order.quantity * mockPrice * 0.001, // %0.1 fee
      metadata: order.metadata
    };
  }

  private recordExecution(result: SignalProcessingResult): void {
    this.executionHistory.push(result);
    
    // History size limitini kontrol et
    if (this.executionHistory.length > this.maxHistorySize) {
      this.executionHistory = this.executionHistory.slice(-this.maxHistorySize);
    }
  }

  // Public API methods
  getActiveSignals(): TradingSignal[] {
    return Array.from(this.activeSignals.values());
  }

  getExecutionHistory(): SignalProcessingResult[] {
    return [...this.executionHistory];
  }

  async getPortfolioStatus(): Promise<PortfolioStatus> {
    // Mock portfolio status - gerçek implementasyonda portfolio service'den alınacak
    return {
      totalBalance: 10000,
      totalPnL: 250,
      openPositions: 2,
      dailyPnL: 50,
      maxDrawdown: -0.02,
      riskLevel: 'medium'
    };
  }

  getExecutionStats(): {
    totalExecutions: number;
    successRate: number;
    averageExecutionTime: number;
    lastExecutionTime?: Date;
  } {
    if (this.executionHistory.length === 0) {
      return {
        totalExecutions: 0,
        successRate: 0,
        averageExecutionTime: 0
      };
    }

    const successful = this.executionHistory.filter(r => r.success).length;
    const totalTime = this.executionHistory.reduce((sum, r) => sum + r.executionTime, 0);

    return {
      totalExecutions: this.executionHistory.length,
      successRate: successful / this.executionHistory.length,
      averageExecutionTime: totalTime / this.executionHistory.length,
      lastExecutionTime: this.executionHistory[this.executionHistory.length - 1]?.timestamp
    };
  }

  clearHistory(): void {
    this.executionHistory = [];
    this.emit('history:cleared');
  }
} 