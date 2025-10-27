"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FEATURE_NAMES = exports.FEATURE_DIM = void 0;
exports.buildFeatures = buildFeatures;
/**
 * Build feature vector from market snapshot
 * Deterministic & fast for offline/online consistency
 */
function buildFeatures(snapshot) {
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
exports.FEATURE_DIM = 6;
/**
 * Feature names for interpretability
 */
exports.FEATURE_NAMES = [
    'bias',
    'mid_price',
    'spread_bp',
    'volume_1m',
    'rsi_14',
    'log_volume'
];
