// ML Feature Version - Single Source of Truth
// Increment on schema changes

export const FEATURE_VERSION = "v2.0.0" as const;

export const MODEL_VERSION = "fusion-v2.0.0" as const;

/**
 * Version history:
 * 
 * v2.0.0 (2025-10-14):
 *   - Initial FeatureRow schema
 *   - OHLCV + RSI + MACD + EMA + ATR
 *   - Ensemble: rsi(0.3) + macd(0.4) + trend(0.3)
 * 
 * Future versions:
 * v2.1.0: + Bayesian weight optimization
 * v2.2.0: + Multi-horizon ensemble
 * v2.3.0: + Advanced features (orderbook, funding)
 */

export function getVersionInfo() {
  return {
    feature: FEATURE_VERSION,
    model: MODEL_VERSION,
    buildSha: process.env.BUILD_SHA || process.env.NEXT_PUBLIC_BUILD_SHA || "dev-local",
    updatedAt: "2025-10-14T00:00:00Z"
  };
}

