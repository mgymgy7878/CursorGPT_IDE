/**
 * Health Status Logic
 * V1.3-P4: Metric-based health determination
 */

export type HealthStatus = 'success' | 'warn' | 'error' | 'neutral';

export interface HealthMetrics {
  error_rate_p95?: number;
  staleness_s?: number;
  uptime_pct?: number;
}

export interface HealthThresholds {
  error_rate_p95: number;    // 0.01 (1%)
  staleness_s: number;        // 60 seconds
  uptime_pct: number;         // 99%
}

const DEFAULT_THRESHOLDS: HealthThresholds = {
  error_rate_p95: 0.01,
  staleness_s: 60,
  uptime_pct: 99.0,
};

/**
 * Determines health status based on metrics and thresholds
 * 
 * @param metrics - Health metrics to evaluate
 * @param thresholds - Threshold values for each metric
 * @returns HealthStatus ('success' | 'warn' | 'error' | 'neutral')
 */
export function getHealthStatus(
  metrics: HealthMetrics,
  thresholds: HealthThresholds = DEFAULT_THRESHOLDS
): HealthStatus {
  // No metrics → neutral
  if (!metrics || Object.keys(metrics).length === 0) {
    return 'neutral';
  }

  // Error rate check
  if (metrics.error_rate_p95 !== undefined) {
    if (metrics.error_rate_p95 > thresholds.error_rate_p95 * 2) return 'error';
    if (metrics.error_rate_p95 > thresholds.error_rate_p95) return 'warn';
  }
  
  // Staleness check
  if (metrics.staleness_s !== undefined) {
    if (metrics.staleness_s > thresholds.staleness_s * 2) return 'error';
    if (metrics.staleness_s > thresholds.staleness_s) return 'warn';
  }
  
  // Uptime check
  if (metrics.uptime_pct !== undefined) {
    if (metrics.uptime_pct < thresholds.uptime_pct - 5) return 'error';
    if (metrics.uptime_pct < thresholds.uptime_pct) return 'warn';
  }
  
  // All checks passed
  return 'success';
}

/**
 * Status string to StatusBadge status mapping
 */
export const STATUS_MAP: Record<string, HealthStatus> = {
  healthy: 'success',
  degraded: 'warn',
  outage: 'error',
  unknown: 'neutral',
  online: 'success',
  offline: 'error',
  paused: 'warn',
  active: 'success',
  error: 'error',
  warning: 'warn',
  success: 'success',
};

/**
 * Maps a status string to HealthStatus
 */
export function mapStatus(status: string): HealthStatus {
  return STATUS_MAP[status.toLowerCase()] || 'neutral';
}

