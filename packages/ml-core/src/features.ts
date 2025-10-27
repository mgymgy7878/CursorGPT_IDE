// ML Feature Engineering (v1.8)
import type { MarketSnapshot, FeatureVec } from './contracts.js';

/**
 * Build feature vector from market snapshot
 * Deterministic & fast for offline/online consistency
 */
export function buildFeatures(snapshot: MarketSnapshot): FeatureVec {
  return [
    1, // bias term
    snapshot.mid,
    snapshot.spreadBp,
    snapshot.vol1m,
    snapshot.rsi14,
    Math.log1p(snapshot.vol1m) // log(1+vol) for stability
  ];
}

/**
 * Feature dimension count (must match model weights)
 */
export const FEATURE_DIM = 6;

/**
 * Feature names for interpretability
 */
export const FEATURE_NAMES = [
  'bias',
  'mid_price',
  'spread_bp',
  'volume_1m',
  'rsi_14',
  'log_volume'
];

