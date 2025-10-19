// ML Signal Fusion - Data Contracts v2.0.0
// Online & Offline birebir aynı şema

export type TF = "1m" | "5m" | "15m" | "1h" | "4h" | "1d";

/**
 * Feature Row - Tek bar, tek an
 * NaN/Infinity yasak, tüm numerikler sonlu olmalı
 */
export interface FeatureRow {
  // Temel
  ts: number;              // ms epoch (bar close)
  symbol: string;          // "BTCUSDT"
  tf: TF;                  // timeframe
  
  // OHLCV
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
  
  // Temel İndikatörler
  rsi_14?: number;
  macd?: number;
  macd_sig?: number;
  macd_hist?: number;
  ema_20?: number;
  ema_50?: number;
  ema_200?: number;
  atr_14?: number;
  
  // Volatilite/Likidite
  vol_z_20?: number;       // z-score of volume
  range_pct?: number;      // (h-l)/c
  
  // Microstructure (opsiyonel)
  spread_bp?: number;      // basis points
  
  // Hedef Etiket (offline/backtesting)
  label_horizon?: number;  // ms (örn 3600000 = 1h)
  fwd_return?: number;     // (c[t+h]-c[t])/c[t]
  label?: -1 | 0 | 1;      // short/flat/long
  
  // Kalite Bayrakları
  _nanGuard?: boolean;     // NaN/Inf görüldü mü
  _mock?: boolean;         // mock köken mi
}

/**
 * Dataset Metadata
 */
export interface DatasetMeta {
  symbol: string;
  tf: TF;
  startTs: number;
  endTs: number;
  horizonMs: number;         // 3600000 (1h)
  buildSha: string;          // app build izi
  featureVersion: string;    // "v2.0.0"
  rows: number;
  nanFiltered: number;       // kalite raporu
}

/**
 * Dataset (eğitim/validasyon)
 */
export interface Dataset {
  meta: DatasetMeta;
  features: FeatureRow[];    // label dolu
}

/**
 * Online Scoring Request
 */
export interface ScoreRequest {
  modelId: string;           // "fusion-v2.0.0"
  feature: FeatureRow;       // tek an
  ctx?: {
    position?: "long" | "short" | "flat";
    equity?: number;
  };
}

/**
 * Online Scoring Response
 */
export interface ScoreResponse {
  ts: number;
  symbol: string;
  decision: -1 | 0 | 1;      // short/flat/long
  score: number;             // [-1, 1] continuous
  confid: number;            // [0, 1]
  featuresUsed: string[];    // seçilen kolonlar
  modelId: string;
  featureVersion: string;
  guardrails: {
    pass: boolean;
    reasons?: string[];
  };
  traceId: string;           // OTEL correlation
}

/**
 * Backtest Report
 */
export interface BacktestReport {
  symbol: string;
  tf: TF;
  period: { startTs: number; endTs: number };
  modelId: string;
  featureVersion: string;
  
  metrics: {
    totalReturn: number;
    winRate: number;
    sharpeRatio: number;
    informationRatio: number;  // IR
    maxDrawdown: number;       // MDD
    totalTrades: number;
    turnover: number;          // avg trades/day
    hitRate: number;           // signal direction accuracy
  };
  
  equity: Array<{ t: number; eq: number }>;
  trades: Array<{
    ts: number;
    side: "long" | "short";
    entry: number;
    exit?: number;
    pnl?: number;
    traceId: string;
  }>;
  
  buildSha: string;
  generatedAt: number;
}

