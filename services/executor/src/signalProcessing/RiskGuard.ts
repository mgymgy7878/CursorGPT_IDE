import { EventEmitter } from "events";
import type { TradingSignal, RiskGuardResult, PortfolioStatus, RiskGuardConfig } from "./types.js";
import { SignalPriority } from "./types.js";

export class RiskGuard extends EventEmitter {
  private config: RiskGuardConfig;
  private portfolioStatus: PortfolioStatus | null = null;
  private dailyTradeCount: number = 0;
  private lastTradeDate: string = new Date().toDateString();
  private emergencyStop: boolean = false;
  private riskAlerts: string[] = [];

  constructor(config: Partial<RiskGuardConfig> = {}) {
    super();
    
    this.config = {
      maxDailyTrades: 10,
      maxDrawdown: 0.05, // %5
      maxPositionSize: 0.1, // %10
      minConfidence: 0.7,
      maxSlippage: 0.02, // %2
      enableReduceOnly: true,
      enableGuardedOrders: true,
      emergencyStopThreshold: 0.1, // %10
      cooldownPeriod: 300000, // 5 dakika
      ...config
    };
  }

  async checkSignal(signal: TradingSignal): Promise<RiskGuardResult> {
    const startTime = Date.now();
    
    try {
      // Emergency stop kontrolü
      if (this.emergencyStop) {
        return {
          allowed: false,
          reason: 'Emergency stop active',
          riskScore: 1.0,
          recommendations: ['Wait for emergency stop to be cleared']
        };
      }

      // Portfolio status güncelle
      await this.updatePortfolioStatus();

      // Risk kontrollerini çalıştır
      const checks = await Promise.all([
        this.checkDailyTradeLimit(),
        this.checkDrawdownLimit(),
        this.checkPositionSizeLimit(signal),
        this.checkConfidenceThreshold(signal),
        this.checkMarketConditions(signal),
        this.checkCooldownPeriod()
      ]);

      // Sonuçları değerlendir
      const failedChecks = checks.filter(check => !check.allowed);
      const riskScore = this.calculateRiskScore(checks, signal);

      if (failedChecks.length > 0) {
        const reasons = failedChecks.map(check => check.reason).join(', ');
        const recommendations = failedChecks.flatMap(check => check.recommendations || []);
        
        this.emit('signal:risk_blocked', signal, reasons);
        
        return {
          allowed: false,
          reason: reasons,
          riskScore,
          recommendations
        };
      }

      // Risk score yüksekse uyarı ver
      if (riskScore > 0.7) {
        this.emit('signal:risk_warning', signal, riskScore);
      }

      const duration = Date.now() - startTime;
      console.log(`🛡️ Risk check: ${signal.id} - ALLOWED (${duration}ms, risk: ${riskScore.toFixed(2)})`);

      return {
        allowed: true,
        riskScore,
        recommendations: this.generateRecommendations(signal, riskScore)
      };

    } catch (error) {
      console.error('Risk check error:', error);
      this.emit('risk:error', signal, error);
      
      return {
        allowed: false,
        reason: `Risk check error: ${(error as Error).message}`,
        riskScore: 1.0
      };
    }
  }

  private async checkDailyTradeLimit(): Promise<RiskGuardResult> {
    const today = new Date().toDateString();
    
    // Gün değiştiyse counter'ı reset et
    if (today !== this.lastTradeDate) {
      this.dailyTradeCount = 0;
      this.lastTradeDate = today;
    }

    if (this.dailyTradeCount >= this.config.maxDailyTrades) {
      return {
        allowed: false,
        reason: `Daily trade limit exceeded (${this.dailyTradeCount}/${this.config.maxDailyTrades})`,
        riskScore: 0.9,
        recommendations: ['Wait for next trading day or increase daily limit']
      };
    }

    return { allowed: true, riskScore: 0.1 };
  }

  private async checkDrawdownLimit(): Promise<RiskGuardResult> {
    if (!this.portfolioStatus) {
      return { allowed: true, riskScore: 0.5 }; // Portfolio bilgisi yoksa geç
    }

    const currentDrawdown = Math.abs(this.portfolioStatus.maxDrawdown);
    
    if (currentDrawdown >= this.config.maxDrawdown) {
      return {
        allowed: false,
        reason: `Maximum drawdown exceeded (${(currentDrawdown * 100).toFixed(1)}% >= ${(this.config.maxDrawdown * 100).toFixed(1)}%)`,
        riskScore: 0.95,
        recommendations: [
          'Close some positions to reduce risk',
          'Review trading strategy',
          'Consider emergency stop'
        ]
      };
    }

    // Drawdown %80'e yaklaşıyorsa uyarı
    if (currentDrawdown >= this.config.maxDrawdown * 0.8) {
      this.addRiskAlert(`High drawdown warning: ${(currentDrawdown * 100).toFixed(1)}%`);
    }

    return { 
      allowed: true, 
      riskScore: currentDrawdown / this.config.maxDrawdown 
    };
  }

  private async checkPositionSizeLimit(signal: TradingSignal): Promise<RiskGuardResult> {
    if (!this.portfolioStatus) {
      return { allowed: true, riskScore: 0.3 };
    }

    // Basit position size kontrolü - geliştirilecek
    const estimatedPositionValue = this.estimatePositionValue(signal);
    const portfolioValue = this.portfolioStatus.totalBalance;
    const positionRatio = estimatedPositionValue / portfolioValue;

    if (positionRatio > this.config.maxPositionSize) {
      return {
        allowed: false,
        reason: `Position size too large (${(positionRatio * 100).toFixed(1)}% > ${(this.config.maxPositionSize * 100).toFixed(1)}%)`,
        riskScore: 0.8,
        recommendations: [
          'Reduce position size',
          'Split order into smaller parts',
          'Wait for better entry point'
        ]
      };
    }

    return { 
      allowed: true, 
      riskScore: positionRatio / this.config.maxPositionSize 
    };
  }

  private async checkConfidenceThreshold(signal: TradingSignal): Promise<RiskGuardResult> {
    if (signal.confidence < this.config.minConfidence) {
      return {
        allowed: false,
        reason: `Signal confidence too low (${(signal.confidence * 100).toFixed(1)}% < ${(this.config.minConfidence * 100).toFixed(1)}%)`,
        riskScore: 0.7,
        recommendations: [
          'Wait for higher confidence signal',
          'Review signal generation logic',
          'Adjust confidence threshold if needed'
        ]
      };
    }

    return { 
      allowed: true, 
      riskScore: 1 - signal.confidence 
    };
  }

  private async checkMarketConditions(signal: TradingSignal): Promise<RiskGuardResult> {
    // Market volatility kontrolü - geliştirilecek
    const volatility = await this.getMarketVolatility(signal.symbol);
    
    if (volatility > 0.05) { // %5 volatility
      return {
        allowed: false,
        reason: `Market too volatile (${(volatility * 100).toFixed(1)}% > 5%)`,
        riskScore: 0.6,
        recommendations: [
          'Wait for market to stabilize',
          'Use smaller position sizes',
          'Consider hedging strategies'
        ]
      };
    }

    return { allowed: true, riskScore: volatility / 0.05 };
  }

  private async checkCooldownPeriod(): Promise<RiskGuardResult> {
    // Son işlemden bu yana geçen süre kontrolü
    const lastTradeTime = this.getLastTradeTime();
    const timeSinceLastTrade = Date.now() - lastTradeTime;
    
    if (timeSinceLastTrade < this.config.cooldownPeriod) {
      const remainingTime = this.config.cooldownPeriod - timeSinceLastTrade;
      return {
        allowed: false,
        reason: `Cooldown period active (${Math.ceil(remainingTime / 1000)}s remaining)`,
        riskScore: 0.4,
        recommendations: ['Wait for cooldown period to end']
      };
    }

    return { allowed: true, riskScore: 0.1 };
  }

  private calculateRiskScore(checks: RiskGuardResult[], signal: TradingSignal): number {
    let totalRisk = 0;
    let weightSum = 0;

    // Her kontrol için ağırlık belirle
    const weights = {
      dailyLimit: 0.2,
      drawdown: 0.3,
      positionSize: 0.2,
      confidence: 0.15,
      marketConditions: 0.1,
      cooldown: 0.05
    };

    checks.forEach((check, index) => {
      const weight = Object.values(weights)[index] || 0.1;
      totalRisk += check.riskScore * weight;
      weightSum += weight;
    });

    // Signal priority'ye göre risk score'u ayarla
    let finalRisk = totalRisk / weightSum;
    
    switch (signal.priority) {
      case SignalPriority.CRITICAL:
        finalRisk *= 0.8; // Kritik sinyaller için risk toleransı artır
        break;
      case SignalPriority.HIGH:
        finalRisk *= 0.9;
        break;
      case SignalPriority.LOW:
        finalRisk *= 1.2; // Düşük öncelikli sinyaller için risk toleransı azalt
        break;
    }

    return Math.min(Math.max(finalRisk, 0), 1);
  }

  private generateRecommendations(signal: TradingSignal, riskScore: number): string[] {
    const recommendations: string[] = [];

    if (riskScore > 0.7) {
      recommendations.push('Consider reducing position size');
      recommendations.push('Monitor closely for early exit');
    }

    if (this.config.enableReduceOnly && signal.action === 'sell') {
      recommendations.push('Use reduce-only orders for safety');
    }

    if (this.config.enableGuardedOrders) {
      recommendations.push('Enable guarded orders with stop-loss');
    }

    return recommendations;
  }

  // Public API methods
  async updatePortfolioStatus(): Promise<void> {
    // Mock portfolio status - gerçek implementasyonda portfolio service'den alınacak
    this.portfolioStatus = {
      totalBalance: 10000,
      totalPnL: 250,
      openPositions: 2,
      dailyPnL: 50,
      maxDrawdown: -0.02,
      riskLevel: 'medium'
    };
  }

  incrementTradeCount(): void {
    this.dailyTradeCount++;
    this.emit('trade:count_updated', this.dailyTradeCount);
  }

  setEmergencyStop(active: boolean): void {
    this.emergencyStop = active;
    this.emit('emergency:stop_changed', active);
    console.log(`🚨 Emergency stop ${active ? 'ACTIVATED' : 'DEACTIVATED'}`);
  }

  addRiskAlert(alert: string): void {
    this.riskAlerts.push(alert);
    this.emit('risk:alert', alert);
    
    // Son 100 alert'i tut
    if (this.riskAlerts.length > 100) {
      this.riskAlerts = this.riskAlerts.slice(-100);
    }
  }

  getRiskAlerts(): string[] {
    return [...this.riskAlerts];
  }

  updateConfig(newConfig: Partial<RiskGuardConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('config:updated', this.config);
  }

  getStatus(): {
    emergencyStop: boolean;
    dailyTradeCount: number;
    maxDailyTrades: number;
    riskAlerts: string[];
    portfolioStatus: PortfolioStatus | null;
  } {
    return {
      emergencyStop: this.emergencyStop,
      dailyTradeCount: this.dailyTradeCount,
      maxDailyTrades: this.config.maxDailyTrades,
      riskAlerts: this.getRiskAlerts(),
      portfolioStatus: this.portfolioStatus
    };
  }

  // Helper methods
  private estimatePositionValue(signal: TradingSignal): number {
    // Basit position value hesaplama - geliştirilecek
    const baseValue = 1000; // $1000 base position
    const confidenceMultiplier = signal.confidence;
    const priorityMultiplier = signal.priority === SignalPriority.CRITICAL ? 2 : 
                              signal.priority === SignalPriority.HIGH ? 1.5 : 1;
    
    return baseValue * confidenceMultiplier * priorityMultiplier;
  }

  private async getMarketVolatility(symbol: string): Promise<number> {
    // Mock volatility - gerçek implementasyonda market data'dan alınacak
    return 0.02 + Math.random() * 0.03; // %2-%5 arası
  }

  private getLastTradeTime(): number {
    // Mock last trade time - gerçek implementasyonda trade history'den alınacak
    return Date.now() - 60000; // 1 dakika önce
  }

  reset(): void {
    this.dailyTradeCount = 0;
    this.emergencyStop = false;
    this.riskAlerts = [];
    this.emit('risk:reset');
  }
} 