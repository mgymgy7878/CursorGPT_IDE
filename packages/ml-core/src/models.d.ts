import type { Model } from './contracts.js';
/**
 * Load baseline logistic model
 * Deterministic weights for reproducible testing
 * v1.8-b0: Simple logistic with fixed weights
 */
export declare function loadBaseline(version?: string): Model;
/**
 * Model registry (future: load from file/S3)
 */
export declare const MODEL_REGISTRY: Record<string, () => Model>;
/**
 * Load model by version
 */
export declare function loadModel(version: string): Model;
