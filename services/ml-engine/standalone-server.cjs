// ML Engine Standalone Server (CJS, Cycle-Free, No Build Required)
// Directly uses ml-core compiled outputs
const Fastify = require('fastify');
const { Registry, Counter, Histogram, Gauge } = require('prom-client');

// Prometheus metrics setup
const registry = new Registry();

const predictRequests = new Counter({
  name: 'ml_predict_requests_total',
  help: 'Total number of prediction requests',
  labelNames: ['model_version', 'status'],
  registers: [registry]
});

const predictLatency = new Histogram({
  name: 'ml_predict_latency_ms',
  help: 'Prediction latency in milliseconds',
  labelNames: ['model_version'],
  buckets: [1, 5, 10, 20, 50, 100, 200, 500, 1000],
  registers: [registry]
});

const modelVersionGauge = new Gauge({
  name: 'ml_model_version',
  help: 'Current model version',
  labelNames: ['version'],
  registers: [registry]
});

const featureExtractions = new Counter({
  name: 'ml_feature_extractions_total',
  help: 'Total feature extractions from snapshots',
  registers: [registry]
});

const predictionScores = new Histogram({
  name: 'ml_prediction_score',
  help: 'Distribution of prediction scores',
  buckets: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
  registers: [registry]
});

const modelErrors = new Counter({
  name: 'ml_model_errors_total',
  help: 'Total model errors',
  labelNames: ['error_type'],
  registers: [registry]
});

// Inline baseline model (same as ml-core)
function loadBaseline(version = 'v1.8-b0') {
  const weights = [-3.0, 0.0004, -0.02, 0.00003, 0.01, 0.0002];
  
  return {
    version,
    predict: (features) => {
      const z = features.reduce((acc, val, idx) => 
        acc + (weights[idx] ?? 0) * val, 0);
      const prob = 1 / (1 + Math.exp(-z));
      return Math.max(1e-6, Math.min(1 - 1e-6, prob));
    }
  };
}

// Inline feature builder (same as ml-core)
function buildFeatures(snapshot) {
  return [
    1, // bias
    snapshot.mid,
    snapshot.spreadBp,
    snapshot.vol1m,
    snapshot.rsi14,
    Math.log1p(snapshot.vol1m)
  ];
}

// Create Fastify app
const app = Fastify({ logger: { level: 'info' } });

// Load model
const model = loadBaseline('v1.8-b0');
modelVersionGauge.set({ version: model.version }, 1);

app.log.info({ modelVersion: model.version }, 'ML model loaded');

// Health endpoint
app.get('/ml/health', async () => ({ 
  ok: true, 
  model: model.version,
  service: 'ml-engine-standalone',
  timestamp: new Date().toISOString()
}));

// Prediction endpoint
app.post('/ml/predict', async (request, reply) => {
  const started = performance.now();
  
  try {
    const body = request.body || {};
    
    // Extract features
    let features = body.features;
    if (!features && body.snapshot) {
      features = buildFeatures(body.snapshot);
      featureExtractions.inc();
    }
    
    if (!features || features.length === 0) {
      throw new Error('No features provided and no snapshot to extract from');
    }
    
    // Predict
    const score = model.predict(features);
    const latency_ms = Math.round(performance.now() - started);
    
    // Record metrics
    predictRequests.inc({ model_version: model.version, status: 'success' });
    predictLatency.observe({ model_version: model.version }, latency_ms);
    predictionScores.observe(score);
    
    return reply.send({
      score,
      version: model.version,
      latency_ms
    });
    
  } catch (error) {
    const latency_ms = Math.round(performance.now() - started);
    
    predictRequests.inc({ model_version: model.version, status: 'error' });
    predictLatency.observe({ model_version: model.version }, latency_ms);
    modelErrors.inc({ error_type: error.message || 'unknown' });
    
    return reply.code(500).send({
      error: error.message || 'Unknown error',
      version: model.version,
      latency_ms
    });
  }
});

// Metrics endpoint
app.get('/ml/metrics', async (_request, reply) => {
  reply.header('Content-Type', registry.contentType);
  return await registry.metrics();
});

// Model info endpoint
app.get('/ml/model/info', async () => ({
  version: model.version,
  type: 'logistic_regression',
  features: ['bias', 'mid_price', 'spread_bp', 'volume_1m', 'rsi_14', 'log_volume'],
  dimension: 6
}));

// Start server
async function start() {
  const port = Number(process.env.ML_PORT || process.env.PORT || 4010);
  const host = process.env.ML_HOST || '0.0.0.0';
  
  await app.listen({ port, host });
  
  app.log.info({ port, host, model: model.version }, '🚀 ML Engine ready');
  console.log('');
  console.log('✅ ML Engine Started (Standalone)');
  console.log(`📊 Health:  http://127.0.0.1:${port}/ml/health`);
  console.log(`📊 Predict: http://127.0.0.1:${port}/ml/predict`);
  console.log(`📊 Metrics: http://127.0.0.1:${port}/ml/metrics`);
  console.log(`📊 Model:   http://127.0.0.1:${port}/ml/model/info`);
  console.log('');
  
  return app;
}

start().catch((err) => {
  console.error('ML Engine failed to start:', err);
  process.exit(1);
});

