// ML Signal Fusion SDK v2.0.0
import { SLO_TARGETS } from "@/lib/constants/slo";
import { FEATURE_VERSION, MODEL_VERSION } from "./featureVersion";
import type { FeatureRow, ScoreRequest, ScoreResponse } from "./schema";

/**
 * Sanitize feature row - NaN/Infinity guard
 * Returns null if invalid
 */
export function sanitize(f: FeatureRow): FeatureRow | null {
  // Check required OHLCV
  const required = [f.o, f.h, f.l, f.c, f.v];
  if (!required.every(x => typeof x === "number" && Number.isFinite(x))) {
    return null;
  }
  
  // Check all numeric values are finite
  for (const [key, value] of Object.entries(f)) {
    if (typeof value === "number" && !Number.isFinite(value)) {
      return null;
    }
  }
  
  return f;
}

/**
 * Fuse signals - weighted ensemble
 * Returns score [-1, 1] and component parts
 */
export function fuseSignals(f: FeatureRow): { score: number; parts: Record<string, number> } {
  const parts: Record<string, number> = {};
  
  // RSI (mean-revert): oversold=bullish, overbought=bearish
  if (typeof f.rsi_14 === "number") {
    parts.rsi = (50 - f.rsi_14) / 50;  // normalize to [-1, 1]
  }
  
  // MACD histogram (momentum)
  if (typeof f.macd_hist === "number") {
    parts.macd = Math.tanh(f.macd_hist);  // squash to [-1, 1]
  }
  
  // EMA trend (crossover)
  if (typeof f.ema_20 === "number" && typeof f.ema_50 === "number" && f.c > 0) {
    parts.trend = Math.tanh((f.ema_20 - f.ema_50) / f.c);
  }
  
  // ATR volatility filter (optional)
  if (typeof f.atr_14 === "number" && f.c > 0) {
    const atrPct = f.atr_14 / f.c;
    parts.vol = atrPct > 0.05 ? 0 : 1;  // high vol → reduce confidence
  }
  
  // Weighted ensemble (weights sum to 1.0)
  const weights = { rsi: 0.3, macd: 0.4, trend: 0.3 };
  const score = weighted(parts, weights);
  
  return { score, parts };
}

/**
 * Weighted average helper
 */
function weighted(parts: Record<string, number>, w: Record<string, number>): number {
  let sum = 0;
  let totalWeight = 0;
  
  for (const key in parts) {
    const weight = w[key] ?? 0;
    sum += (parts[key] ?? 0) * weight;
    totalWeight += weight;
  }
  
  return totalWeight > 0 ? Math.max(-1, Math.min(1, sum / totalWeight)) : 0;
}

/**
 * Decision logic - convert score to discrete action
 */
export function decide(score: number, confidFloor = 0.55): { decision: -1 | 0 | 1; confid: number } {
  const absScore = Math.abs(score);
  const confid = Math.max(0, Math.min(1, absScore));
  
  // Below confidence threshold → flat (no action)
  if (absScore < confidFloor) {
    return { decision: 0, confid };
  }
  
  // Above threshold → long (1) or short (-1)
  const decision = score > 0 ? 1 : -1;
  return { decision: decision as -1 | 1, confid };
}

/**
 * Guardrails check - SLO compliance
 */
export function guardrailsCheck(ctx: {
  staleness_s?: number;
  p95_ms?: number;
  error_rate?: number;
  confid?: number;
}): { pass: boolean; reasons: string[] } {
  const reasons: string[] = [];
  
  // SLO checks
  if ((ctx.staleness_s ?? 0) > SLO_TARGETS.STALENESS_S) {
    reasons.push("staleness_breach");
  }
  if ((ctx.p95_ms ?? 0) > SLO_TARGETS.P95_MS) {
    reasons.push("p95_breach");
  }
  if ((ctx.error_rate ?? 0) > SLO_TARGETS.ERROR_RATE) {
    reasons.push("error_rate_breach");
  }
  
  // Confidence floor
  if ((ctx.confid ?? 0) < 0.55) {
    reasons.push("low_confidence");
  }
  
  return {
    pass: reasons.length === 0,
    reasons
  };
}

/**
 * Main scoring function
 */
export function score(req: ScoreRequest): ScoreResponse {
  // Sanitize input
  const f = sanitize(req.feature);
  if (!f) {
    throw new Error("invalid_feature: NaN or Infinity detected");
  }
  
  // Fuse signals
  const { score: rawScore, parts } = fuseSignals(f);
  
  // Decide action
  const { decision, confid } = decide(rawScore);
  
  // Guardrails check (can add SLO context here)
  const guard = guardrailsCheck({ confid });
  
  // Generate trace ID (will be replaced by OTEL in production)
  const traceId = typeof crypto !== 'undefined' && crypto.randomUUID 
    ? crypto.randomUUID() 
    : `ml-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
  
  return {
    ts: f.ts,
    symbol: f.symbol,
    decision,
    score: rawScore,
    confid,
    featuresUsed: Object.keys(parts),
    modelId: req.modelId || MODEL_VERSION,
    featureVersion: FEATURE_VERSION,
    guardrails: guard,
    traceId
  };
}

/**
 * Batch scoring for backtesting
 */
export function scoreBatch(features: FeatureRow[], modelId: string): ScoreResponse[] {
  return features
    .map(f => {
      try {
        return score({ modelId, feature: f });
      } catch {
        return null;
      }
    })
    .filter((s): s is ScoreResponse => s !== null);
}

