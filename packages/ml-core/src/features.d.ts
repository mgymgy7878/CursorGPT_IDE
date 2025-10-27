import type { MarketSnapshot, FeatureVec } from './contracts.js';
/**
 * Build feature vector from market snapshot
 * Deterministic & fast for offline/online consistency
 */
export declare function buildFeatures(snapshot: MarketSnapshot): FeatureVec;
/**
 * Feature dimension count (must match model weights)
 */
export declare const FEATURE_DIM = 6;
/**
 * Feature names for interpretability
 */
export declare const FEATURE_NAMES: string[];
