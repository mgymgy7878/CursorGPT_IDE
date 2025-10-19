/**
 * Audit cardinality health monitoring
 */

export interface AuditHealthStats {
  mlScoreRate: number; // per minute
  mlBucketDistribution: Record<string, number>; // bucket -> count
  mlSignalPartsNullRate: number; // percentage
  timestamp: number;
}

/**
 * Mock audit health stats (production would query database)
 */
export function getAuditHealthStats(): AuditHealthStats {
  // Mock data - production would aggregate from audit_log table
  return {
    mlScoreRate: 12.5, // scores per minute
    mlBucketDistribution: {
      "0.5": 45,
      "0.6": 123,
      "0.7": 187,
      "0.8": 98,
      "0.9": 67,
      "1.0": 23
    },
    mlSignalPartsNullRate: 0.3, // 0.3% null rate
    timestamp: Date.now()
  };
}

/**
 * Check if audit health is within acceptable bounds
 */
export function validateAuditHealth(stats: AuditHealthStats): {
  healthy: boolean;
  warnings: string[];
  critical: string[];
} {
  const warnings: string[] = [];
  const critical: string[] = [];

  // ML score rate check
  if (stats.mlScoreRate < 1) {
    critical.push(`ML score rate too low: ${stats.mlScoreRate}/min`);
  } else if (stats.mlScoreRate < 5) {
    warnings.push(`ML score rate low: ${stats.mlScoreRate}/min`);
  }

  // Bucket distribution check
  const totalBuckets = Object.values(stats.mlBucketDistribution).reduce((a, b) => a + b, 0);
  if (totalBuckets < 100) {
    warnings.push(`Low bucket data: ${totalBuckets} samples`);
  }

  // Signal parts null rate check
  if (stats.mlSignalPartsNullRate > 1) {
    critical.push(`High signal parts null rate: ${stats.mlSignalPartsNullRate}%`);
  } else if (stats.mlSignalPartsNullRate > 0.5) {
    warnings.push(`Signal parts null rate elevated: ${stats.mlSignalPartsNullRate}%`);
  }

  return {
    healthy: critical.length === 0,
    warnings,
    critical
  };
}
