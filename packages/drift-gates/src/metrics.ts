import { register, Counter, Histogram, Gauge } from 'prom-client';

// Drift Gates Metrics
export const driftGatesMetrics = {
  // Overall drift score
  driftScore: new Gauge({
    name: 'drift_score',
    help: 'Overall drift score between paper and live trading',
    labelNames: ['drift_type', 'market_condition']
  }),
  
  // Price difference
  paperLiveDelta: new Gauge({
    name: 'paper_live_delta',
    help: 'Price difference between paper and live trades',
    labelNames: ['symbol', 'trade_type']
  }),
  
  // Gate status
  gateState: new Gauge({
    name: 'gate_state',
    help: 'Gate status (0=open, 1=closed, 2=recovery, 3=emergency)',
    labelNames: ['gate_type', 'reason']
  }),
  
  // Drift detection latency
  driftDetectionLatency: new Histogram({
    name: 'drift_detection_latency_ms',
    help: 'Time to detect drift in milliseconds',
    labelNames: ['drift_type', 'detection_method'],
    buckets: [1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, '+Inf']
  }),
  
  // Gate response time
  gateResponseTime: new Histogram({
    name: 'gate_response_time_ms',
    help: 'Time to respond to drift detection',
    labelNames: ['gate_type', 'action'],
    buckets: [10, 50, 100, 250, 500, 1000, 2500, 5000, 10000, '+Inf']
  }),
  
  // Recovery time
  recoveryTime: new Histogram({
    name: 'recovery_time_ms',
    help: 'Time to recover from drift condition',
    labelNames: ['recovery_type', 'drift_severity'],
    buckets: [100, 500, 1000, 2500, 5000, 10000, 30000, 60000, '+Inf']
  }),
  
  // Drift events
  driftEventsTotal: new Counter({
    name: 'drift_events_total',
    help: 'Total number of drift events detected',
    labelNames: ['drift_type', 'severity', 'market_condition']
  }),
  
  // Gate actions
  gateActionsTotal: new Counter({
    name: 'gate_actions_total',
    help: 'Total number of gate actions taken',
    labelNames: ['action_type', 'gate_type', 'reason']
  }),
  
  // False positives
  falsePositivesTotal: new Counter({
    name: 'false_positives_total',
    help: 'Total number of false positive drift detections',
    labelNames: ['drift_type', 'detection_method']
  }),
  
  // Recovery success rate
  recoverySuccessRate: new Gauge({
    name: 'recovery_success_rate',
    help: 'Success rate of recovery procedures',
    labelNames: ['recovery_type', 'drift_severity']
  })
};

// Registry'ye ekle
register.registerMetric(driftGatesMetrics.driftScore);
register.registerMetric(driftGatesMetrics.paperLiveDelta);
register.registerMetric(driftGatesMetrics.gateState);
register.registerMetric(driftGatesMetrics.driftDetectionLatency);
register.registerMetric(driftGatesMetrics.gateResponseTime);
register.registerMetric(driftGatesMetrics.recoveryTime);
register.registerMetric(driftGatesMetrics.driftEventsTotal);
register.registerMetric(driftGatesMetrics.gateActionsTotal);
register.registerMetric(driftGatesMetrics.falsePositivesTotal);
register.registerMetric(driftGatesMetrics.recoverySuccessRate);

export { register };
