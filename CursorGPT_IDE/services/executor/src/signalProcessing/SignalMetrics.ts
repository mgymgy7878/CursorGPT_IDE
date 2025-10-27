import type { TradingSignal, SignalProcessingResult, SignalMetrics as SignalMetricsData } from "./types";

export class SignalMetrics {
  private metrics: SignalMetricsData = {
    totalSignals: 0,
    validatedSignals: 0,
    rejectedSignals: 0,
    executedSignals: 0,
    failedSignals: 0,
    averageProcessingTime: 0,
    dailyTradeCount: 0,
    successRate: 0,
    queueSize: 0,
    activeSignals: 0,
    lastResetDate: new Date().toDateString(),
    dailyTrades: new Map<string, number>()
  };

  private processingTimes: number[] = [];
  private dailyCounters: Map<string, number> = new Map();
  private rejectionReasons: Map<string, number> = new Map(); // Track rejection reasons

  constructor() {
    this.resetDailyCounters();
  }

  recordValidation(success: boolean): void {
    if (success) {
      this.metrics.validatedSignals++;
    } else {
      this.metrics.rejectedSignals++;
    }
    this.updateSuccessRate();
  }

  recordRejection(reason: string): void {
    this.metrics.rejectedSignals++;
    this.rejectionReasons.set(reason, (this.rejectionReasons.get(reason) || 0) + 1);
    this.updateSuccessRate();
  }

  recordExecution(result: SignalProcessingResult): void {
    if (result.success) {
      this.metrics.executedSignals++;
      this.incrementDailyTradeCount();
    } else {
      this.metrics.failedSignals++;
    }

    // Processing time'ı kaydet
    this.recordProcessingTime(result.executionTime);
    
    this.updateSuccessRate();
    this.updateAverageProcessingTime();
    
    this.logMetric('execution', { 
      signalId: result.signalId, 
      success: result.success, 
      executionTime: result.executionTime 
    });
  }

  recordProcessingTime(timeMs: number): void {
    this.processingTimes.push(timeMs);
    
    // Son 1000 processing time'ı tut
    if (this.processingTimes.length > 1000) {
      this.processingTimes = this.processingTimes.slice(-1000);
    }
  }

  updateQueueSize(size: number): void {
    this.metrics.queueSize = size;
  }

  updateActiveSignals(count: number): void {
    this.metrics.activeSignals = count;
  }

  private incrementDailyTradeCount(): void {
    const today = new Date().toDateString();
    
    // Gün değiştiyse counter'ları reset et
    if (today !== this.metrics.lastResetDate) {
      this.resetDailyCounters();
      this.metrics.lastResetDate = today;
    }
    
    const currentCount = this.metrics.dailyTrades.get(today) || 0;
    this.metrics.dailyTrades.set(today, currentCount + 1);
    this.metrics.dailyTradeCount = currentCount + 1;
  }

  private resetDailyCounters(): void {
    this.metrics.dailyTradeCount = 0;
    this.metrics.dailyTrades.clear();
  }

  private updateSuccessRate(): void {
    const totalProcessed = this.metrics.executedSignals + this.metrics.failedSignals;
    if (totalProcessed > 0) {
      this.metrics.successRate = this.metrics.executedSignals / totalProcessed;
    }
  }

  private updateAverageProcessingTime(): void {
    if (this.processingTimes.length > 0) {
      const totalTime = this.processingTimes.reduce((sum, time) => sum + time, 0);
      this.metrics.averageProcessingTime = totalTime / this.processingTimes.length;
    }
  }

  getMetrics(): SignalMetricsData {
    return { ...this.metrics };
  }

  getDailyTradeCount(): number {
    return this.metrics.dailyTradeCount;
  }

  getProcessingTimeStats(): {
    average: number;
    min: number;
    max: number;
    median: number;
    percentile95: number;
  } {
    if (this.processingTimes.length === 0) {
      return {
        average: 0,
        min: 0,
        max: 0,
        median: 0,
        percentile95: 0
      };
    }

    const sorted = [...this.processingTimes].sort((a, b) => a - b);
    const count = sorted.length;
    
    return {
      average: sorted.reduce((sum, time) => sum + time, 0) / count,
      min: sorted[0] ?? 0,
      max: sorted[count - 1] ?? 0,
      median: sorted[Math.floor(count / 2)] ?? 0,
      percentile95: sorted[Math.floor(count * 0.95)] ?? 0
    };
  }

  getValidationStats(): {
    totalValidations: number;
    validationSuccessRate: number;
    commonRejectionReasons: Record<string, number>;
  } {
    const totalValidations = this.metrics.validatedSignals + this.metrics.rejectedSignals;
    const validationSuccessRate = totalValidations > 0 ? 
      this.metrics.validatedSignals / totalValidations : 0;

    // Convert rejection reasons map to object
    const commonRejectionReasons: Record<string, number> = {};
    for (const [reason, count] of this.rejectionReasons.entries()) {
      commonRejectionReasons[reason] = count;
    }

    return {
      totalValidations,
      validationSuccessRate,
      commonRejectionReasons
    };
  }

  getExecutionStats(): {
    totalExecutions: number;
    executionSuccessRate: number;
    averageExecutionTime: number;
    executionTimeDistribution: Record<string, number>;
  } {
    const totalExecutions = this.metrics.executedSignals + this.metrics.failedSignals;
    const executionSuccessRate = totalExecutions > 0 ? 
      this.metrics.executedSignals / totalExecutions : 0;

    // Execution time distribution
    const distribution: Record<string, number> = {
      '0-100ms': 0,
      '100-500ms': 0,
      '500ms-1s': 0,
      '1s-5s': 0,
      '5s+': 0
    };

    for (const time of this.processingTimes) {
      if (time < 100) {
        distribution['0-100ms'] = (distribution['0-100ms'] || 0) + 1;
      } else if (time < 500) {
        distribution['100-500ms'] = (distribution['100-500ms'] || 0) + 1;
      } else if (time < 1000) {
        distribution['500ms-1s'] = (distribution['500ms-1s'] || 0) + 1;
      } else if (time < 5000) {
        distribution['1s-5s'] = (distribution['1s-5s'] || 0) + 1;
      } else {
        distribution['5s+'] = (distribution['5s+'] || 0) + 1;
      }
    }

    return {
      totalExecutions,
      executionSuccessRate,
      averageExecutionTime: this.metrics.averageProcessingTime,
      executionTimeDistribution: distribution
    };
  }

  getPerformanceAlerts(): {
    highFailureRate: boolean;
    slowProcessing: boolean;
    queueOverflow: boolean;
    recommendations: string[];
  } {
    const alerts = {
      highFailureRate: false,
      slowProcessing: false,
      queueOverflow: false,
      recommendations: [] as string[]
    };

    // Failure rate kontrolü
    if (this.metrics.successRate < 0.8 && this.metrics.executedSignals + this.metrics.failedSignals > 10) {
      alerts.highFailureRate = true;
      alerts.recommendations.push('Signal execution failure rate is high (>20%). Review signal quality and validation rules.');
    }

    // Processing time kontrolü
    if (this.metrics.averageProcessingTime > 2000) { // 2 saniye
      alerts.slowProcessing = true;
      alerts.recommendations.push('Average processing time is high (>2s). Consider optimizing execution pipeline.');
    }

    // Queue overflow kontrolü
    if (this.metrics.queueSize > 50) {
      alerts.queueOverflow = true;
      alerts.recommendations.push('Signal queue is getting full (>50). Consider increasing processing capacity.');
    }

    return alerts;
  }

  reset(): void {
    this.metrics = {
      totalSignals: 0,
      validatedSignals: 0,
      rejectedSignals: 0,
      executedSignals: 0,
      failedSignals: 0,
      averageProcessingTime: 0,
      dailyTradeCount: 0,
      successRate: 0,
      queueSize: 0,
      activeSignals: 0,
      lastResetDate: new Date().toDateString(),
      dailyTrades: new Map<string, number>()
    };
    this.processingTimes = [];
    this.rejectionReasons.clear();
    this.resetDailyCounters();
  }

  exportMetrics(): {
    timestamp: Date;
    metrics: SignalMetricsData;
    processingTimeStats: any;
    performanceAlerts: any;
  } {
    return {
      timestamp: new Date(),
      metrics: this.getMetrics(),
      processingTimeStats: this.getProcessingTimeStats(),
      performanceAlerts: this.getPerformanceAlerts()
    };
  }

  private logMetric(type: string, data: any): void {
    const timestamp = new Date().toISOString();
    console.log(`📊 [${timestamp}] ${type.toUpperCase()}:`, JSON.stringify(data));
  }
} 