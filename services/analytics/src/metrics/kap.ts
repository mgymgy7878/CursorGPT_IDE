// services/analytics/src/metrics/kap.ts
import { Counter, Gauge } from 'prom-client';

/**
 * KAP scan counter
 */
export const kapScans = new Counter({
  name: 'spark_kap_scans_total',
  help: 'Total KAP scans performed',
  labelNames: [],
});

/**
 * KAP disclosures found
 */
export const kapDisclosuresFound = new Counter({
  name: 'spark_kap_disclosures_found_total',
  help: 'Total KAP disclosures found',
  labelNames: ['type', 'class'],
});

/**
 * KAP scan errors
 */
export const kapErrors = new Counter({
  name: 'spark_kap_errors_total',
  help: 'Total KAP scan errors',
  labelNames: ['error_type'],
});

/**
 * KAP last scan timestamp
 */
export const kapLastScanTime = new Gauge({
  name: 'spark_kap_last_scan_timestamp',
  help: 'Unix timestamp of last KAP scan',
  labelNames: [],
});

/**
 * KAP scan staleness
 */
export const kapScanStaleness = new Gauge({
  name: 'spark_kap_scan_staleness_seconds',
  help: 'Seconds since last KAP scan',
  labelNames: [],
});

/**
 * KAP high-impact signal count
 */
export const kapHighImpactSignals = new Gauge({
  name: 'spark_kap_high_impact_signals',
  help: 'Number of high-impact KAP signals (score > 0.7)',
  labelNames: [],
});

/**
 * Metrics export object
 */
export const kapMetrics = {
  scans: kapScans,
  disclosuresFound: kapDisclosuresFound,
  errors: kapErrors,
  lastScanTime: kapLastScanTime,
  staleness: kapScanStaleness,
  highImpactSignals: kapHighImpactSignals,
};

