import { EventEmitter } from "events";
import { SignalValidator } from "./SignalValidator";
import { SignalQueue } from "./SignalQueue";
import { SignalExecutor } from "./SignalExecutor";
import { SignalMetrics } from "./SignalMetrics";
import { RiskGuard } from "./RiskGuard";
import { FeatureStore } from "./FeatureStore";
import type { 
  TradingSignal, 
  SignalProcessingConfig, 
  SignalProcessingResult,
  SignalPriority,
  SignalStatus 
} from "./types";

export class SignalProcessor extends EventEmitter {
  private validator: SignalValidator;
  private queue: SignalQueue;
  private executor: SignalExecutor;
  private metrics: SignalMetrics;
  private riskGuard: RiskGuard;
  private featureStore: FeatureStore;
  private config: SignalProcessingConfig;
  private isRunning: boolean = false;
  private processingInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<SignalProcessingConfig> = {}) {
    super();
    
    this.config = {
      maxConcurrentSignals: 3,
      processingIntervalMs: 1000,
      maxQueueSize: 100,
      enableAutoExecution: true,
      enableRiskGuards: true,
      enableMetrics: true,
      riskLimits: {
        maxDailyTrades: 10,
        maxDrawdown: 0.1,
        maxPositionSize: 0.05,
        minConfidence: 0.6
      },
      executionSettings: {
        defaultQuantity: 0.01,
        enableReduceOnly: true,
        enableGuardedOrders: true,
        maxSlippage: 0.01
      },
      ...config
    };

    this.validator = new SignalValidator();
    this.queue = new SignalQueue(this.config.maxQueueSize);
    this.executor = new SignalExecutor();
    this.metrics = new SignalMetrics();
    this.riskGuard = new RiskGuard({
      maxDailyTrades: this.config.riskLimits.maxDailyTrades,
      maxDrawdown: this.config.riskLimits.maxDrawdown,
      maxPositionSize: this.config.riskLimits.maxPositionSize,
      minConfidence: this.config.riskLimits.minConfidence,
      enableReduceOnly: this.config.executionSettings.enableReduceOnly,
      enableGuardedOrders: this.config.executionSettings.enableGuardedOrders
    });

    this.featureStore = new FeatureStore({
      enableFeatureExtraction: true,
      enablePatternAnalysis: true,
      maxHistorySize: 5000
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Signal validation events
    this.validator.on('signal:validated', (signal: TradingSignal) => {
      this.queue.enqueue(signal);
      this.metrics.recordValidation(true);
      this.emit('signal:queued', signal);
    });

    this.validator.on('signal:rejected', (signal: TradingSignal, reason: string) => {
      this.metrics.recordValidation(false);
      this.metrics.recordRejection(reason);
      this.emit('signal:rejected', signal, reason);
    });

    // Queue events
    this.queue.on('signal:ready', (signal: TradingSignal) => {
      if (this.config.enableAutoExecution) {
        this.processSignal(signal);
      } else {
        this.emit('signal:ready', signal);
      }
    });

    // Execution events
    this.executor.on('signal:executed', (result: SignalProcessingResult) => {
      this.metrics.recordExecution(result);
      this.riskGuard.incrementTradeCount();
      this.emit('signal:executed', result);
    });

    this.executor.on('signal:failed', (result: SignalProcessingResult) => {
      this.metrics.recordExecution(result);
      this.emit('signal:failed', result);
    });

    // Risk guard events
    this.riskGuard.on('signal:risk_blocked', (signal: TradingSignal, reason: string) => {
      this.emit('signal:risk_blocked', signal, reason);
    });

    this.riskGuard.on('signal:risk_warning', (signal: TradingSignal, riskScore: number) => {
      this.emit('signal:risk_warning', signal, riskScore);
    });

    this.riskGuard.on('emergency:stop_changed', (active: boolean) => {
      this.emit('emergency:stop_changed', active);
    });

    this.riskGuard.on('risk:alert', (alert: string) => {
      this.emit('risk:alert', alert);
    });

    // Feature store events
    this.featureStore.on('features:extracted', (signalId: string, features: any) => {
      this.emit('features:extracted', signalId, features);
    });

    this.featureStore.on('patterns:updated', (symbol: string, patterns: any) => {
      this.emit('patterns:updated', symbol, patterns);
    });

    this.featureStore.on('performance:updated', (result: SignalProcessingResult) => {
      this.emit('performance:updated', result);
    });
  }

  async start(): Promise<void> {
    if (this.isRunning) return;

    this.isRunning = true;
    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, this.config.processingIntervalMs);

    await this.executor.start();
    this.emit('processor:started');
    console.log('🚀 Signal Processor başlatıldı');
  }

  async stop(): Promise<void> {
    if (!this.isRunning) return;

    this.isRunning = false;
    
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    await this.executor.stop();
    this.emit('processor:stopped');
    console.log('🛑 Signal Processor durduruldu');
  }

  async submitSignal(signal: TradingSignal): Promise<boolean> {
    try {
      // Signal'i validate et
      const isValid = await this.validator.validate(signal);
      
      if (!isValid) {
        return false;
      }

      // Signal'i queue'ya ekle
      const queued = this.queue.enqueue(signal);
      
      if (queued) {
        this.emit('signal:submitted', signal);
        return true;
      } else {
        this.emit('signal:queue_full', signal);
        return false;
      }
    } catch (error) {
      console.error('Signal submission error:', error);
      this.emit('signal:error', signal, error);
      return false;
    }
  }

  private async processQueue(): Promise<void> {
    if (!this.isRunning) return;

    try {
      const activeSignals = this.executor.getActiveSignals();
      
      if (activeSignals.length >= this.config.maxConcurrentSignals) {
        return; // Maksimum concurrent signal limitine ulaşıldı
      }

      // Queue'dan signal al
      const signal = this.queue.dequeue();
      if (signal) {
        await this.processSignal(signal);
      }
    } catch (error) {
      console.error('Queue processing error:', error);
    }
  }

  private async processSignal(signal: TradingSignal): Promise<void> {
    try {
      // Risk guard kontrolü
      if (this.config.enableRiskGuards) {
        const riskCheck = await this.checkRiskGuards(signal);
        if (!riskCheck.allowed) {
          this.emit('signal:risk_blocked', signal, riskCheck.reason);
          return;
        }
      }

      // Signal'i feature store'a kaydet
      await this.featureStore.storeSignal(signal);

      // Signal'i executor'a gönder
      const result = await this.executor.execute(signal);
      
      // Execution result'ı feature store'a kaydet
      await this.featureStore.storeExecutionResult(result);
      
      if (result.success) {
        this.emit('signal:processed', result);
      } else {
        this.emit('signal:processing_failed', result);
      }
    } catch (error) {
      console.error('Signal processing error:', error);
      this.emit('signal:processing_error', signal, error);
    }
  }

  private async checkRiskGuards(signal: TradingSignal): Promise<{ allowed: boolean; reason?: string }> {
    const riskResult = await this.riskGuard.checkSignal(signal);
    return {
      allowed: riskResult.allowed,
      reason: riskResult.reason
    };
  }



  // Public API methods
  getStatus(): {
    isRunning: boolean;
    queueSize: number;
    activeSignals: number;
    metrics: any;
  } {
    return {
      isRunning: this.isRunning,
      queueSize: this.queue.getSize(),
      activeSignals: this.executor.getActiveSignals().length,
      metrics: this.metrics.getMetrics()
    };
  }

  getMetrics(): any {
    return this.metrics.getMetrics();
  }

  clearQueue(): void {
    this.queue.clear();
    this.emit('queue:cleared');
  }

  updateConfig(newConfig: Partial<SignalProcessingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('config:updated', this.config);
  }

  // Risk Guard API methods
  setEmergencyStop(active: boolean): void {
    this.riskGuard.setEmergencyStop(active);
  }

  getRiskStatus(): any {
    return this.riskGuard.getStatus();
  }

  getRiskAlerts(): string[] {
    return this.riskGuard.getRiskAlerts();
  }

  updateRiskConfig(newConfig: Partial<any>): void {
    this.riskGuard.updateConfig(newConfig);
  }

  resetRiskGuard(): void {
    this.riskGuard.reset();
  }

  // Feature Store API methods
  async getFeatureVector(signal: TradingSignal): Promise<any> {
    return await this.featureStore.getFeatureVector(signal);
  }

  async getSignalRecommendations(signal: TradingSignal): Promise<string[]> {
    return await this.featureStore.getSignalRecommendations(signal);
  }

  getSignalHistory(symbol?: string, limit?: number): TradingSignal[] {
    return this.featureStore.getSignalHistory(symbol, limit);
  }

  getExecutionHistory(signalId?: string, limit?: number): SignalProcessingResult[] {
    return this.featureStore.getExecutionHistory(signalId, limit);
  }

  getPatternAnalysis(symbol: string): any {
    return this.featureStore.getPatternAnalysis(symbol);
  }

  getPerformanceMetrics(symbol?: string): any {
    return this.featureStore.getPerformanceMetrics(symbol);
  }

  clearFeatureHistory(): void {
    this.featureStore.clearHistory();
  }
} 