// ML Models (v1.8)
// Baseline logistic regression (seed-based, reproducible)
import type { Model, FeatureVec } from './contracts.js';

/**
 * Load baseline logistic model
 * Deterministic weights for reproducible testing
 * v1.8-b0: Simple logistic with fixed weights
 */
export function loadBaseline(version = 'v1.8-b0'): Model {
  // Fixed weights (bias, mid, spread, vol, rsi, log_vol)
  const weights = [-3.0, 0.0004, -0.02, 0.00003, 0.01, 0.0002];
  
  return {
    version,
    predict: (features: FeatureVec): number => {
      // Linear combination
      const z = features.reduce((acc, val, idx) => 
        acc + (weights[idx] ?? 0) * val, 0);
      
      // Logistic sigmoid
      const prob = 1 / (1 + Math.exp(-z));
      
      // Clip to [1e-6, 1-1e-6] for numerical stability
      return Math.max(1e-6, Math.min(1 - 1e-6, prob));
    }
  };
}

/**
 * Model registry (future: load from file/S3)
 */
export const MODEL_REGISTRY: Record<string, () => Model> = {
  'v1.8-b0': () => loadBaseline('v1.8-b0'),
  'baseline': () => loadBaseline('v1.8-b0')
};

/**
 * Load model by version
 */
export function loadModel(version: string): Model {
  const factory = MODEL_REGISTRY[version];
  if (!factory) {
    throw new Error(`Unknown model version: ${version}`);
  }
  return factory();
}

