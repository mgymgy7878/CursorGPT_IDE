import { EventEmitter } from "events";
import type { 
  ExecutionStartParams, 
  ExecutionResult, 
  OrderResult, 
  ExecutionEvent, 
  TradeEvent,
  ExecutionData,
  TradeData 
} from "./types";
import { EventBus } from "./bus/EventBus";
import { PrismaRepo } from "./persist/PrismaRepo";
import { getExchangeConfig } from "./config/exchange";
import { BinanceRestClient } from "./exchange/binance/RestClient";
import { BinanceUserStream } from "./exchange/binance/UserStream";
import { BinanceMarketStream } from "./market/MarketStream";

export class Executor extends EventEmitter {
  private eventBus: EventBus;
  private repo: PrismaRepo;
  private config: any;
  private restClient!: BinanceRestClient;
  private userStream!: BinanceUserStream;
  private marketStream!: BinanceMarketStream;
  private isInitialized: boolean = false;

  constructor() {
    super();
    this.eventBus = new EventBus();
    this.repo = new PrismaRepo();
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.config = getExchangeConfig();
      this.restClient = new BinanceRestClient(this.config);
      this.userStream = new BinanceUserStream(this.config, this.restClient);
      this.marketStream = new BinanceMarketStream(this.config);

      // Setup user stream event handlers
      this.userStream.on('execution:placed', this.handleExecutionPlaced.bind(this));
      this.userStream.on('execution:filled', this.handleExecutionFilled.bind(this));
      this.userStream.on('execution:cancelled', this.handleExecutionCancelled.bind(this));
      this.userStream.on('execution:partial', this.handleExecutionPartial.bind(this));

      // Setup market stream event handlers
      this.marketStream.on('marketData', this.handleMarketData.bind(this));

      // Start streams
      await this.userStream.start();
      await this.marketStream.start(['btcusdt']);

      this.isInitialized = true;
      console.log('Executor başlatıldı');
    } catch (error) {
      console.error('Executor başlatma hatası:', error);
      throw error;
    }
  }

  async startExecution(params: ExecutionStartParams): Promise<ExecutionResult> {
    await this.ensureInitialized();

    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Save initial execution
    await this.repo.saveExecution({
      id: executionId,
      strategyId: params.strategyId,
      mode: params.mode,
      symbol: params.symbol,
      side: params.side,
      qty: params.qty,
      status: 'arm',
      startedAt: new Date(),
      lastState: 'arm'
    });

    // Emit event
    this.eventBus.emitExecution({
      type: 'execution:started',
      executionId,
      data: params
    });

    return {
      executionId,
      status: 'arm',
      nextStep: 'confirm'
    };
  }

  async confirmExecution(executionId: string, approve: boolean, execute: boolean = false): Promise<ExecutionResult> {
    await this.ensureInitialized();

    if (!approve) {
      await this.repo.updateExecutionStatus(executionId, 'cancelled');
      return { executionId, status: 'cancelled' };
    }

    // Update status
    await this.repo.updateExecutionStatus(executionId, 'confirm');

    if (!execute) {
      return {
        executionId,
        status: 'confirm',
        nextStep: 'execute'
      };
    }

    // Place real order
    const execution = await this.repo.getExecution(executionId);
    if (!execution) {
      throw new Error('Execution not found');
    }

    try {
      const orderResult = await this.placeRealOrder(execution);
      
      // Update with order details
      await this.repo.updateExecutionOrder(executionId, {
        exchangeOrderId: orderResult.orderId,
        clientOrderId: orderResult.clientOrderId,
        status: 'live'
      });

      // Emit placed event
      this.eventBus.emitExecution({
        type: 'execution:placed',
        executionId,
        data: orderResult
      });

      return {
        executionId,
        status: 'live',
        orderId: orderResult.orderId,
        clientOrderId: orderResult.clientOrderId
      };
    } catch (error) {
      console.error('Order placement error:', error);
      await this.repo.updateExecutionStatus(executionId, 'error');
      
      return {
        executionId,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async placeRealOrder(execution: ExecutionData): Promise<OrderResult> {
    const clientOrderId = `cli_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const orderParams = {
      symbol: execution.symbol.toUpperCase(),
      side: execution.side as 'BUY' | 'SELL',
      type: 'MARKET' as const,
      quantity: execution.qty.toString(),
      newClientOrderId: clientOrderId,
      newOrderRespType: 'FULL' as const
    };

    const response = await this.restClient.placeOrder(orderParams);
    
    return {
      orderId: response.orderId.toString(),
      clientOrderId: response.clientOrderId,
      status: response.status as any,
      price: parseFloat(response.price || '0'),
      qty: parseFloat(response.executedQty || '0'),
      timestamp: new Date(response.transactTime)
    };
  }

  private async handleExecutionPlaced(event: any): Promise<void> {
    const { executionId, orderId, data } = event;
    
    console.log('Execution placed:', executionId, orderId);
    
    // Update execution status
    await this.repo.updateExecutionStatus(executionId, 'live');
    
    // Emit event
    this.eventBus.emitExecution({
      type: 'execution:placed',
      executionId,
      data: { orderId, ...data }
    });
  }

  private async handleExecutionFilled(event: any): Promise<void> {
    const { executionId, orderId, data } = event;
    
    console.log('Execution filled:', executionId, orderId);
    
    // Update execution status
    await this.repo.updateExecutionStatus(executionId, 'filled');
    
    // Save trade data
    if (data.fills && data.fills.length > 0) {
      for (const fill of data.fills) {
        const tradeData: TradeData = {
          id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          symbol: data.symbol,
          side: data.side as any,
          qty: parseFloat(fill.qty),
          price: parseFloat(fill.price),
          fee: parseFloat(fill.commission),
          feeAsset: fill.commissionAsset,
          ts: new Date(data.transactTime),
          executionId
        };
        
        await this.repo.saveTrade(tradeData);
        
        // Emit trade event
        this.eventBus.emitTrade({
          type: 'trade:filled',
          executionId,
          tradeId: tradeData.id,
          data: {
            symbol: tradeData.symbol,
            side: tradeData.side as 'BUY' | 'SELL',
            qty: tradeData.qty,
            price: tradeData.price || 0,
            fee: tradeData.fee,
            feeAsset: tradeData.feeAsset,
            timestamp: tradeData.ts
          }
        });
      }
    }
    
    // Emit execution event
    this.eventBus.emitExecution({
      type: 'execution:filled',
      executionId,
      data: { orderId, ...data }
    });
  }

  private async handleExecutionCancelled(event: any): Promise<void> {
    const { executionId, orderId, data } = event;
    
    console.log('Execution cancelled:', executionId, orderId);
    
    // Update execution status
    await this.repo.updateExecutionStatus(executionId, 'cancelled');
    
    // Emit event
    this.eventBus.emitExecution({
      type: 'execution:cancelled',
      executionId,
      data: { orderId, ...data }
    });
  }

  private async handleExecutionPartial(event: any): Promise<void> {
    const { executionId, orderId, data } = event;
    
    console.log('Execution partial:', executionId, orderId);
    
    // Update execution status
    await this.repo.updateExecutionStatus(executionId, 'partial');
    
    // Save partial trade data
    if (data.fills && data.fills.length > 0) {
      for (const fill of data.fills) {
        const tradeData: TradeData = {
          id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          symbol: data.symbol,
          side: data.side as any,
          qty: parseFloat(fill.qty),
          price: parseFloat(fill.price),
          fee: parseFloat(fill.commission),
          feeAsset: fill.commissionAsset,
          ts: new Date(data.transactTime),
          executionId
        };
        
        await this.repo.saveTrade(tradeData);
        
        // Emit trade event
        this.eventBus.emitTrade({
          type: 'trade:partial',
          executionId,
          tradeId: tradeData.id,
          data: {
            symbol: tradeData.symbol,
            side: tradeData.side as 'BUY' | 'SELL',
            qty: tradeData.qty,
            price: tradeData.price || 0,
            fee: tradeData.fee,
            feeAsset: tradeData.feeAsset,
            timestamp: tradeData.ts
          }
        });
      }
    }
    
    // Emit execution event
    this.eventBus.emitExecution({
      type: 'execution:filled',
      executionId,
      data: { orderId, ...data }
    });
  }

  private handleMarketData(event: any): void {
    // Emit market data to event bus
    this.eventBus.emitExecution({
      type: 'execution:started',
      executionId: 'market-data',
      data: event
    });
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  getEventBus(): EventBus {
    return this.eventBus;
  }

  getRepo(): PrismaRepo {
    return this.repo;
  }

  isUserStreamConnected(): boolean {
    return this.userStream?.isStreamConnected() || false;
  }

  isMarketStreamConnected(): boolean {
    return this.marketStream?.isStreamConnected() || false;
  }

  async shutdown(): Promise<void> {
    if (this.userStream) {
      await this.userStream.stop();
    }
    if (this.marketStream) {
      await this.marketStream.stop();
    }
    this.isInitialized = false;
  }
} 