/**
 * Health Status Logic Tests
 * V1.3-P4: Full coverage for getHealthStatus
 */

import { getHealthStatus, mapStatus, type HealthMetrics } from './health';

describe('getHealthStatus', () => {
  test('returns success for healthy metrics', () => {
    const metrics: HealthMetrics = {
      error_rate_p95: 0.001,
      staleness_s: 10,
      uptime_pct: 99.9,
    };
    expect(getHealthStatus(metrics)).toBe('success');
  });

  test('returns warn for degraded error rate', () => {
    const metrics: HealthMetrics = {
      error_rate_p95: 0.015, // > 0.01 threshold
      staleness_s: 30,
      uptime_pct: 99.5,
    };
    expect(getHealthStatus(metrics)).toBe('warn');
  });

  test('returns error for high error rate', () => {
    const metrics: HealthMetrics = {
      error_rate_p95: 0.05, // > 0.02 (2x threshold)
    };
    expect(getHealthStatus(metrics)).toBe('error');
  });

  test('returns warn for high staleness', () => {
    const metrics: HealthMetrics = {
      staleness_s: 80, // > 60 threshold
    };
    expect(getHealthStatus(metrics)).toBe('warn');
  });

  test('returns error for very high staleness', () => {
    const metrics: HealthMetrics = {
      staleness_s: 150, // > 120 (2x threshold)
    };
    expect(getHealthStatus(metrics)).toBe('error');
  });

  test('returns warn for low uptime', () => {
    const metrics: HealthMetrics = {
      uptime_pct: 98.5, // < 99.0 threshold
    };
    expect(getHealthStatus(metrics)).toBe('warn');
  });

  test('returns error for very low uptime', () => {
    const metrics: HealthMetrics = {
      uptime_pct: 90.0, // < 94.0 (threshold - 5)
    };
    expect(getHealthStatus(metrics)).toBe('error');
  });

  test('returns neutral for empty metrics', () => {
    expect(getHealthStatus({})).toBe('neutral');
  });

  test('returns error for worst metric', () => {
    // Should return 'error' even if some metrics are good
    const metrics: HealthMetrics = {
      error_rate_p95: 0.001, // good
      staleness_s: 200, // error (> 120)
      uptime_pct: 99.9, // good
    };
    expect(getHealthStatus(metrics)).toBe('error');
  });
});

describe('mapStatus', () => {
  test('maps healthy to success', () => {
    expect(mapStatus('healthy')).toBe('success');
    expect(mapStatus('HEALTHY')).toBe('success');
  });

  test('maps degraded to warn', () => {
    expect(mapStatus('degraded')).toBe('warn');
  });

  test('maps outage to error', () => {
    expect(mapStatus('outage')).toBe('error');
  });

  test('maps unknown status to neutral', () => {
    expect(mapStatus('random-status')).toBe('neutral');
  });
});

