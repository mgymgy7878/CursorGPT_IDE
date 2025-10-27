// ML Pipeline Contracts (v1.8)
// Type-only file - no imports to prevent cycles

export type Bar = { 
  ts: number; 
  o: number; 
  h: number; 
  l: number; 
  c: number; 
  v: number; 
};

export type MarketSnapshot = { 
  ts: number; 
  mid: number; 
  spreadBp: number; 
  vol1m: number; 
  rsi14: number; 
};

export type FeatureVec = number[];

export type Label = 0 | 1; // next N bar up-move?

export type PredictRequest = { 
  symbol: string; 
  snapshot: MarketSnapshot; 
  features?: FeatureVec;
};

export type PredictResponse = { 
  score: number; 
  version: string; 
  latency_ms: number; 
};

export type TrainConfig = { 
  horizonBars: number; 
  lookbackBars: number; 
  features: string[]; 
  seed?: number; 
};

export interface Model { 
  version: string; 
  predict: (x: FeatureVec) => number; 
}

export interface OfflineReport {
  version: string;
  auc: number;
  precision_at_20: number;
  recall_at_20: number;
  timestamp: number;
}

export interface EvalResult {
  passed: boolean;
  auc_check: boolean;
  precision_check: boolean;
  message: string;
}

