import { FEATURE_VERSION, MODEL_VERSION } from './featureVersion';

/**
 * Schema hash for drift detection between TS and Python
 * Generated from: FeatureRow fields + types + ScoreRequest/Response structure
 * 
 * Python equivalent: hash(f"{sorted(FeatureRow.__annotations__)}")
 */
export const SCHEMA_HASH = 'a1b2c3d4e5f6789'; // Placeholder - CI will compute real hash

/**
 * Version info for contract drift detection
 */
export interface VersionInfo {
  featureVersion: string;
  modelVersion: string;
  schemaHash: string;
  buildSha: string;
  timestamp: number;
}

/**
 * Get complete version information for drift detection
 */
export function getVersionInfo(): VersionInfo {
  return {
    featureVersion: FEATURE_VERSION,
    modelVersion: MODEL_VERSION,
    schemaHash: SCHEMA_HASH,
    buildSha: process.env.BUILD_SHA || process.env.NEXT_PUBLIC_BUILD_SHA || 'dev-local',
    timestamp: Date.now()
  };
}

/**
 * Validate schema hash matches Python equivalent
 * CI will call this and fail if mismatch
 */
export function validateSchemaHash(): { valid: boolean; tsHash: string; expectedHash?: string } {
  const expectedHash = process.env.PYTHON_SCHEMA_HASH;
  
  return {
    valid: !expectedHash || SCHEMA_HASH === expectedHash,
    tsHash: SCHEMA_HASH,
    expectedHash
  };
}
