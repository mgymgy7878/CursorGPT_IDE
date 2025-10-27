import { EventEmitter } from "events";
import type { 
  TradingSignal, 
  SignalProcessingResult, 
  FeatureStoreConfig,
  SignalFeature,
  PatternAnalysis,
  MarketFeature,
  FeatureVector 
} from "./types";

export class FeatureStore extends EventEmitter {
  private config: FeatureStoreConfig;
  private signalHistory: TradingSignal[] = [];
  private executionHistory: SignalProcessingResult[] = [];
  private marketFeatures: Map<string, MarketFeature[]> = new Map();
  private patternCache: Map<string, PatternAnalysis> = new Map();
  private maxHistorySize: number = 10000;

  constructor(config: Partial<FeatureStoreConfig> = {}) {
    super();
    
    this.config = {
      enableFeatureExtraction: true,
      enablePatternAnalysis: true,
      enableMarketFeatures: true,
      maxHistorySize: 10000,
      patternWindowSize: 100,
      featureUpdateInterval: 60000, // 1 dakika
      ...config
    };
  }

  async storeSignal(signal: TradingSignal): Promise<void> {
    try {
      // Signal'i history'ye ekle
      this.signalHistory.push(signal);
      
      // History size limitini kontrol et
      if (this.signalHistory.length > this.config.maxHistorySize) {
        this.signalHistory = this.signalHistory.slice(-this.config.maxHistorySize);
      }

      // Feature extraction
      if (this.config.enableFeatureExtraction) {
        const features = await this.extractSignalFeatures(signal);
        this.emit('features:extracted', signal.id, features);
      }

      // Pattern analysis
      if (this.config.enablePatternAnalysis) {
        const patterns = await this.analyzePatterns(signal.symbol);
        this.patternCache.set(signal.symbol, patterns);
        this.emit('patterns:updated', signal.symbol, patterns);
      }

      console.log(`📊 Feature store: Signal ${signal.id} stored`);
    } catch (error) {
      console.error('Feature store error:', error);
      this.emit('feature:error', signal, error);
    }
  }

  async storeExecutionResult(result: SignalProcessingResult): Promise<void> {
    try {
      // Execution result'ı history'ye ekle
      this.executionHistory.push(result);
      
      // History size limitini kontrol et
      if (this.executionHistory.length > this.config.maxHistorySize) {
        this.executionHistory = this.executionHistory.slice(-this.config.maxHistorySize);
      }

      // Performance metrics güncelle
      await this.updatePerformanceMetrics(result);

      console.log(`📊 Feature store: Execution result ${result.signalId} stored`);
    } catch (error) {
      console.error('Feature store execution error:', error);
      this.emit('feature:execution_error', result, error);
    }
  }

  async extractSignalFeatures(signal: TradingSignal): Promise<SignalFeature> {
    const features: SignalFeature = {
      signalId: signal.id,
      timestamp: signal.timestamp,
      symbol: signal.symbol,
      action: signal.action,
      confidence: signal.confidence,
      riskLevel: signal.riskLevel,
      timeframe: signal.timeframe,
      priority: signal.priority,
      
      // Technical features
      technicalFeatures: {
        rsi: await this.calculateRSI(signal.symbol),
        macd: await this.calculateMACD(signal.symbol),
        bollingerBands: await this.calculateBollingerBands(signal.symbol),
        volume: await this.getVolume(signal.symbol),
        volatility: await this.calculateVolatility(signal.symbol)
      },

      // Market features
      marketFeatures: {
        spread: await this.getSpread(signal.symbol),
        liquidity: await this.getLiquidity(signal.symbol),
        marketSentiment: await this.getMarketSentiment(signal.symbol),
        timeOfDay: this.getTimeOfDay(),
        dayOfWeek: this.getDayOfWeek()
      },

      // Historical features
      historicalFeatures: {
        successRate: this.calculateSuccessRate(signal.symbol),
        avgConfidence: this.calculateAvgConfidence(signal.symbol),
        signalFrequency: this.calculateSignalFrequency(signal.symbol),
        lastSignalAge: this.getLastSignalAge(signal.symbol)
      }
    };

    return features;
  }

  async analyzePatterns(symbol: string): Promise<PatternAnalysis> {
    const symbolSignals = this.signalHistory.filter(s => s.symbol === symbol);
    
    if (symbolSignals.length < this.config.patternWindowSize) {
      return {
        symbol,
        timestamp: new Date(),
        patterns: [],
        confidence: 0.5
      };
    }

    const recentSignals = symbolSignals.slice(-this.config.patternWindowSize);
    const patterns: any[] = [];

    // Pattern recognition algorithms
    patterns.push(...await this.findTrendPatterns(recentSignals));
    patterns.push(...await this.findReversalPatterns(recentSignals));
    patterns.push(...await this.findVolatilityPatterns(recentSignals));
    patterns.push(...await this.findTimePatterns(recentSignals));

    const confidence = this.calculatePatternConfidence(patterns);

    return {
      symbol,
      timestamp: new Date(),
      patterns,
      confidence
    };
  }

  async getFeatureVector(signal: TradingSignal): Promise<FeatureVector> {
    const signalFeatures = await this.extractSignalFeatures(signal);
    const patterns = this.patternCache.get(signal.symbol);
    
    return {
      signalId: signal.id,
      features: signalFeatures,
      patterns: patterns || null,
      metadata: {
        extractedAt: new Date(),
        featureCount: Object.keys(signalFeatures).length
      }
    };
  }

  async getSignalRecommendations(signal: TradingSignal): Promise<string[]> {
    const featureVector = await this.getFeatureVector(signal);
    const recommendations: string[] = [];

    // Confidence-based recommendations
    if (signal.confidence < 0.7) {
      recommendations.push('Consider waiting for higher confidence signal');
    }

    // Pattern-based recommendations
    if (featureVector.patterns) {
      const bullishPatterns = featureVector.patterns.patterns.filter(p => p.type === 'bullish');
      const bearishPatterns = featureVector.patterns.patterns.filter(p => p.type === 'bearish');
      
      if (signal.action === 'buy' && bearishPatterns.length > bullishPatterns.length) {
        recommendations.push('Warning: Bearish patterns detected, consider waiting');
      }
      
      if (signal.action === 'sell' && bullishPatterns.length > bearishPatterns.length) {
        recommendations.push('Warning: Bullish patterns detected, consider waiting');
      }
    }

    // Historical performance recommendations
    const successRate = featureVector.features.historicalFeatures.successRate;
    if (successRate < 0.6) {
      recommendations.push('Historical success rate is low for this symbol');
    }

    // Volatility recommendations
    const volatility = featureVector.features.technicalFeatures.volatility;
    if (volatility > 0.05) {
      recommendations.push('High volatility detected, consider smaller position size');
    }

    return recommendations;
  }

  // Public API methods
  getSignalHistory(symbol?: string, limit?: number): TradingSignal[] {
    let history = this.signalHistory;
    
    if (symbol) {
      history = history.filter(s => s.symbol === symbol);
    }
    
    if (limit) {
      history = history.slice(-limit);
    }
    
    return [...history];
  }

  getExecutionHistory(signalId?: string, limit?: number): SignalProcessingResult[] {
    let history = this.executionHistory;
    
    if (signalId) {
      history = history.filter(r => r.signalId === signalId);
    }
    
    if (limit) {
      history = history.slice(-limit);
    }
    
    return [...history];
  }

  getPatternAnalysis(symbol: string): PatternAnalysis | null {
    return this.patternCache.get(symbol) || null;
  }

  getPerformanceMetrics(symbol?: string): {
    totalSignals: number;
    successRate: number;
    avgConfidence: number;
    avgExecutionTime: number;
    bestPerformingTimeframe: string;
  } {
    const signals = symbol ? 
      this.signalHistory.filter(s => s.symbol === symbol) : 
      this.signalHistory;

    const executions = symbol ?
      this.executionHistory.filter(r => {
        const signal = this.signalHistory.find(s => s.id === r.signalId);
        return signal?.symbol === symbol;
      }) :
      this.executionHistory;

    const totalSignals = signals.length;
    const successfulExecutions = executions.filter(r => r.success).length;
    const successRate = executions.length > 0 ? successfulExecutions / executions.length : 0;
    const avgConfidence = signals.length > 0 ? 
      signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length : 0;
    const avgExecutionTime = executions.length > 0 ?
      executions.reduce((sum, r) => sum + r.executionTime, 0) / executions.length : 0;

    // Best performing timeframe
    const timeframeStats = new Map<string, { count: number; success: number }>();
    signals.forEach(signal => {
      const stats = timeframeStats.get(signal.timeframe) || { count: 0, success: 0 };
      stats.count++;
      const execution = executions.find(r => r.signalId === signal.id);
      if (execution?.success) stats.success++;
      timeframeStats.set(signal.timeframe, stats);
    });

    let bestTimeframe = 'medium';
    let bestRate = 0;
    timeframeStats.forEach((stats, timeframe) => {
      const rate = stats.count > 0 ? stats.success / stats.count : 0;
      if (rate > bestRate) {
        bestRate = rate;
        bestTimeframe = timeframe;
      }
    });

    return {
      totalSignals,
      successRate,
      avgConfidence,
      avgExecutionTime,
      bestPerformingTimeframe: bestTimeframe
    };
  }

  // Helper methods
  private async calculateRSI(symbol: string): Promise<number> {
    // Mock RSI calculation - gerçek implementasyonda technical analysis'dan alınacak
    return 50 + (Math.random() - 0.5) * 40; // 30-70 arası
  }

  private async calculateMACD(symbol: string): Promise<{ macd: number; signal: number; histogram: number }> {
    // Mock MACD calculation
    const macd = (Math.random() - 0.5) * 2;
    const signal = macd * 0.8;
    const histogram = macd - signal;
    
    return { macd, signal, histogram };
  }

  private async calculateBollingerBands(symbol: string): Promise<{ upper: number; middle: number; lower: number }> {
    // Mock Bollinger Bands
    const middle = 50000 + (Math.random() - 0.5) * 1000;
    const std = middle * 0.02;
    
    return {
      upper: middle + (2 * std),
      middle,
      lower: middle - (2 * std)
    };
  }

  private async getVolume(symbol: string): Promise<number> {
    // Mock volume
    return 1000000 + Math.random() * 5000000;
  }

  private async calculateVolatility(symbol: string): Promise<number> {
    // Mock volatility
    return 0.02 + Math.random() * 0.03;
  }

  private async getSpread(symbol: string): Promise<number> {
    // Mock spread
    return 0.0001 + Math.random() * 0.0002;
  }

  private async getLiquidity(symbol: string): Promise<number> {
    // Mock liquidity
    return 0.8 + Math.random() * 0.2;
  }

  private async getMarketSentiment(symbol: string): Promise<number> {
    // Mock sentiment (-1 to 1)
    return -1 + Math.random() * 2;
  }

  private getTimeOfDay(): number {
    const now = new Date();
    return now.getHours() + now.getMinutes() / 60;
  }

  private getDayOfWeek(): number {
    return new Date().getDay();
  }

  private calculateSuccessRate(symbol: string): number {
    const symbolSignals = this.signalHistory.filter(s => s.symbol === symbol);
    const executions = this.executionHistory.filter(r => {
      const signal = symbolSignals.find(s => s.id === r.signalId);
      return signal !== undefined;
    });

    if (executions.length === 0) return 0.5;
    
    const successful = executions.filter(r => r.success).length;
    return successful / executions.length;
  }

  private calculateAvgConfidence(symbol: string): number {
    const symbolSignals = this.signalHistory.filter(s => s.symbol === symbol);
    if (symbolSignals.length === 0) return 0.5;
    
    return symbolSignals.reduce((sum, s) => sum + s.confidence, 0) / symbolSignals.length;
  }

  private calculateSignalFrequency(symbol: string): number {
    const symbolSignals = this.signalHistory.filter(s => s.symbol === symbol);
    const now = Date.now();
    const oneHourAgo = now - 3600000;
    
    const recentSignals = symbolSignals.filter(s => s.timestamp.getTime() > oneHourAgo);
    return recentSignals.length / 60; // signals per minute
  }

  private getLastSignalAge(symbol: string): number {
    const symbolSignals = this.signalHistory.filter(s => s.symbol === symbol);
    if (symbolSignals.length === 0) return Infinity;
    
    const lastSignal = symbolSignals[symbolSignals.length - 1];
    if (!lastSignal) return Infinity;
    
    return Date.now() - lastSignal.timestamp.getTime();
  }

  private async findTrendPatterns(signals: TradingSignal[]): Promise<any[]> {
    // Mock trend pattern detection
    const patterns: any[] = [];
    
    if (signals.length >= 3) {
      const recent = signals.slice(-3);
      const actions = recent.map(s => s.action);
      
      if (actions.every(a => a === 'buy')) {
        patterns.push({
          type: 'trend',
          direction: 'bullish',
          confidence: 0.7,
          description: 'Consecutive buy signals'
        });
      } else if (actions.every(a => a === 'sell')) {
        patterns.push({
          type: 'trend',
          direction: 'bearish',
          confidence: 0.7,
          description: 'Consecutive sell signals'
        });
      }
    }
    
    return patterns;
  }

  private async findReversalPatterns(signals: TradingSignal[]): Promise<any[]> {
    // Mock reversal pattern detection
    return [];
  }

  private async findVolatilityPatterns(signals: TradingSignal[]): Promise<any[]> {
    // Mock volatility pattern detection
    return [];
  }

  private async findTimePatterns(signals: TradingSignal[]): Promise<any[]> {
    // Mock time pattern detection
    return [];
  }

  private calculatePatternConfidence(patterns: any[]): number {
    if (patterns.length === 0) return 0.5;
    
    const avgConfidence = patterns.reduce((sum, p) => sum + (p.confidence || 0.5), 0) / patterns.length;
    return Math.min(avgConfidence, 1);
  }

  private async updatePerformanceMetrics(result: SignalProcessingResult): Promise<void> {
    // Performance metrics güncelleme
    this.emit('performance:updated', result);
  }

  clearHistory(): void {
    this.signalHistory = [];
    this.executionHistory = [];
    this.patternCache.clear();
    this.emit('history:cleared');
  }
} 