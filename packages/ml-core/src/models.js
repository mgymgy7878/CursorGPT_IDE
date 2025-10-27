"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MODEL_REGISTRY = void 0;
exports.loadBaseline = loadBaseline;
exports.loadModel = loadModel;
/**
 * Load baseline logistic model
 * Deterministic weights for reproducible testing
 * v1.8-b0: Simple logistic with fixed weights
 */
function loadBaseline(version = 'v1.8-b0') {
    // Fixed weights (bias, mid, spread, vol, rsi, log_vol)
    const weights = [-3.0, 0.0004, -0.02, 0.00003, 0.01, 0.0002];
    return {
        version,
        predict: (features) => {
            // Linear combination
            const z = features.reduce((acc, val, idx) => acc + (weights[idx] ?? 0) * val, 0);
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
exports.MODEL_REGISTRY = {
    'v1.8-b0': () => loadBaseline('v1.8-b0'),
    'baseline': () => loadBaseline('v1.8-b0')
};
/**
 * Load model by version
 */
function loadModel(version) {
    const factory = exports.MODEL_REGISTRY[version];
    if (!factory) {
        throw new Error(`Unknown model version: ${version}`);
    }
    return factory();
}
