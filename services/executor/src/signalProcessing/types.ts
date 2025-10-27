export interface TradingSignal {
  id: string;
  symbol: string;
  action: 'buy' | 'sell' | 'hold' | 'close';
  confidence: number; // 0-1 arası
  reasoning: string;
  strategyId?: string;
  timeframe: 'short' | 'medium' | 'long';
  riskLevel: 'low' | 'medium' | 'high';
  timestamp: Date;
  executed: boolean;
  priority: SignalPriority;
  metadata?: Record<string, any>;
}

export enum SignalPriority {
  LOW = 1,
  NORMAL = 2,
  HIGH = 3,
  CRITICAL = 4
}

export enum SignalStatus {
  PENDING = 'pending',
  VALIDATING = 'validating',
  QUEUED = 'queued',
  PROCESSING = 'processing',
  EXECUTED = 'executed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  RISK_BLOCKED = 'risk_blocked'
}

export interface SignalProcessingConfig {
  maxConcurrentSignals: number;
  processingIntervalMs: number;
  maxQueueSize: number;
  enableAutoExecution: boolean;
  enableRiskGuards: boolean;
  enableMetrics: boolean;
  riskLimits: {
    maxDailyTrades: number;
    maxDrawdown: number; // 0-1 arası
    maxPositionSize: number; // 0-1 arası
    minConfidence: number; // 0-1 arası
  };
  executionSettings: {
    defaultQuantity: number;
    enableReduceOnly: boolean;
    enableGuardedOrders: boolean;
    maxSlippage: number; // 0-1 arası
  };
}

export interface SignalProcessingResult {
  signalId: string;
  success: boolean;
  status: SignalStatus;
  executionTime: number; // ms
  timestamp: Date;
  orderId?: string;
  error?: string;
  metadata?: Record<string, any>;
}

export interface SignalValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  confidence: number;
}

export interface SignalMetrics {
  totalSignals: number;
  validatedSignals: number;
  rejectedSignals: number;
  executedSignals: number;
  failedSignals: number;
  averageProcessingTime: number;
  dailyTradeCount: number;
  successRate: number;
  lastSignalTime?: Date;
  queueSize: number;
  activeSignals: number;
  lastResetDate: string;
  dailyTrades: Map<string, number>;
}

export interface PortfolioStatus {
  totalBalance: number;
  totalPnL: number;
  openPositions: number;
  dailyPnL: number;
  maxDrawdown: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface RiskGuardResult {
  allowed: boolean;
  reason?: string;
  riskScore: number; // 0-1 arası
  recommendations?: string[];
}

export interface RiskGuardConfig {
  maxDailyTrades: number;
  maxDrawdown: number; // 0-1 arası
  maxPositionSize: number; // 0-1 arası
  minConfidence: number; // 0-1 arası
  maxSlippage: number; // 0-1 arası
  enableReduceOnly: boolean;
  enableGuardedOrders: boolean;
  emergencyStopThreshold: number; // 0-1 arası
  cooldownPeriod: number; // ms
}

export interface FeatureStoreConfig {
  enableFeatureExtraction: boolean;
  enablePatternAnalysis: boolean;
  enableMarketFeatures: boolean;
  maxHistorySize: number;
  patternWindowSize: number;
  featureUpdateInterval: number; // ms
}

export interface SignalFeature {
  signalId: string;
  timestamp: Date;
  symbol: string;
  action: 'buy' | 'sell' | 'hold' | 'close';
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high';
  timeframe: 'short' | 'medium' | 'long';
  priority: SignalPriority;
  technicalFeatures: {
    rsi: number;
    macd: { macd: number; signal: number; histogram: number };
    bollingerBands: { upper: number; middle: number; lower: number };
    volume: number;
    volatility: number;
  };
  marketFeatures: {
    spread: number;
    liquidity: number;
    marketSentiment: number;
    timeOfDay: number;
    dayOfWeek: number;
  };
  historicalFeatures: {
    successRate: number;
    avgConfidence: number;
    signalFrequency: number;
    lastSignalAge: number;
  };
}

export interface PatternAnalysis {
  symbol: string;
  timestamp: Date;
  patterns: Array<{
    type: string;
    direction?: 'bullish' | 'bearish';
    confidence: number;
    description: string;
  }>;
  confidence: number;
}

export interface MarketFeature {
  symbol: string;
  timestamp: Date;
  price: number;
  volume: number;
  volatility: number;
  spread: number;
}

export interface FeatureVector {
  signalId: string;
  features: SignalFeature;
  patterns: PatternAnalysis | null;
  metadata: {
    extractedAt: Date;
    featureCount: number;
  };
}

export interface SignalQueueItem {
  signal: TradingSignal;
  priority: SignalPriority;
  timestamp: Date;
  attempts: number;
}

export interface ExecutionOrder {
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price?: number;
  orderType: 'market' | 'limit' | 'stop' | 'stop_limit';
  reduceOnly?: boolean;
  timeInForce?: 'GTC' | 'IOC' | 'FOK';
  stopPrice?: number;
  metadata?: Record<string, any>;
}

export interface ExecutionResult {
  orderId: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  status: 'filled' | 'partial' | 'cancelled' | 'rejected';
  timestamp: Date;
  fees?: number;
  metadata?: Record<string, any>;
} 