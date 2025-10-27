// ML Engine Prometheus Metrics (v1.8)
import { Counter, Histogram, Gauge, Registry } from 'prom-client';

export const registry = new Registry();

// Prediction request counter
export const predictRequests = new Counter({
  name: 'ml_predict_requests_total',
  help: 'Total number of ML prediction requests',
  labelNames: ['model_version', 'status'],
  registers: [registry]
});

// Prediction latency histogram
export const predictLatency = new Histogram({
  name: 'ml_predict_latency_ms_bucket',
  help: 'ML prediction latency in milliseconds',
  labelNames: ['model_version'],
  buckets: [5, 10, 20, 40, 80, 160, 320, Number.POSITIVE_INFINITY],
  registers: [registry]
});

// Model version info gauge
export const modelVersionGauge = new Gauge({
  name: 'ml_model_version_info',
  help: 'Currently loaded model version',
  labelNames: ['version'],
  registers: [registry]
});

// Feature extraction counter
export const featureExtractions = new Counter({
  name: 'ml_feature_extractions_total',
  help: 'Total number of feature extractions',
  registers: [registry]
});

// Prediction score histogram
export const predictionScores = new Histogram({
  name: 'ml_prediction_score_bucket',
  help: 'Distribution of prediction scores',
  buckets: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, Number.POSITIVE_INFINITY],
  registers: [registry]
});

// Model errors counter
export const modelErrors = new Counter({
  name: 'ml_model_errors_total',
  help: 'Total number of model prediction errors',
  labelNames: ['error_type'],
  registers: [registry]
});

