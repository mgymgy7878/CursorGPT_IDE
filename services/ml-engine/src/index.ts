// ML Engine Service (v1.8)
// Model serving & prediction API
import Fastify from 'fastify';
import { 
  registry, 
  predictRequests, 
  predictLatency, 
  modelVersionGauge,
  featureExtractions,
  predictionScores,
  modelErrors
} from './metrics.js';
import { buildFeatures, loadBaseline } from '../../../packages/ml-core/src/index.js';
import type { PredictRequest, PredictResponse } from '../../../packages/ml-core/src/contracts.js';

const app = Fastify({ 
  logger: {
    level: 'info'
  }
});

// Load baseline model
const model = loadBaseline('v1.8-b0');
modelVersionGauge.set({ version: model.version }, 1);

app.log.info({ modelVersion: model.version }, 'ML model loaded');

// Health endpoint
app.get('/ml/health', async () => ({ 
  ok: true, 
  model: model.version,
  service: 'ml-engine',
  timestamp: new Date().toISOString()
}));

// Prediction endpoint
app.post<{ Body: PredictRequest }>('/ml/predict', async (request, reply) => {
  const started = performance.now();
  
  try {
    const body = request.body || {} as PredictRequest;
    
    // Extract features (use provided or build from snapshot)
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
    
    const response: PredictResponse = {
      score,
      version: model.version,
      latency_ms
    };
    
    return reply.send(response);
    
  } catch (error) {
    const latency_ms = Math.round(performance.now() - started);
    
    predictRequests.inc({ model_version: model.version, status: 'error' });
    predictLatency.observe({ model_version: model.version }, latency_ms);
    modelErrors.inc({ error_type: error instanceof Error ? error.message : 'unknown' });
    
    return reply.code(500).send({
      error: error instanceof Error ? error.message : 'Unknown error',
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
export default async function start() {
  const port = Number(process.env.ML_PORT || 4010);
  const host = process.env.ML_HOST || '0.0.0.0';
  
  await app.listen({ port, host });
  
  app.log.info({ port, host, model: model.version }, '🚀 ML Engine ready');
  console.log('');
  console.log('✅ ML Engine Started');
  console.log(`📊 Health:  http://127.0.0.1:${port}/ml/health`);
  console.log(`📊 Predict: http://127.0.0.1:${port}/ml/predict`);
  console.log(`📊 Metrics: http://127.0.0.1:${port}/ml/metrics`);
  console.log(`📊 Model:   http://127.0.0.1:${port}/ml/model/info`);
  console.log('');
  
  return app;
}

// Auto-start if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  start().catch((err) => {
    console.error('ML Engine failed to start:', err);
    process.exit(1);
  });
}

