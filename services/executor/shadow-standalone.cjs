// Shadow Prediction Standalone Tester (v1.8 Faz 3)
// Runs shadow logic without full executor bootstrap
const Fastify = require('fastify');
const { Counter, Histogram, Gauge, Registry } = require('prom-client');

// Configuration
const ML_ENGINE_URL = process.env.ML_ENGINE_URL || 'http://127.0.0.1:4010';
const SHADOW_TIMEOUT_MS = Number(process.env.SHADOW_TIMEOUT_MS || 60);
const MATCH_THRESHOLD = Number(process.env.SHADOW_MATCH_THRESHOLD || 0.05);
const PORT = Number(process.env.PORT || 4001);

// Prometheus registry
const registry = new Registry();

// Metrics
const shadowSuccess = new Counter({
  name: 'ml_shadow_success_total',
  help: 'Total successful shadow predictions',
  registers: [registry]
});

const shadowError = new Counter({
  name: 'ml_shadow_error_total',
  help: 'Total shadow prediction errors',
  labelNames: ['error_type'],
  registers: [registry]
});

const shadowMatchTotal = new Counter({
  name: 'ml_shadow_match_total',
  help: 'Total matches between baseline and shadow',
  registers: [registry]
});

const shadowMismatchTotal = new Counter({
  name: 'ml_shadow_mismatch_total',
  help: 'Total mismatches between baseline and shadow',
  registers: [registry]
});

const shadowAbsDelta = new Histogram({
  name: 'ml_shadow_abs_delta',
  help: 'Absolute delta between baseline and shadow predictions',
  buckets: [0.001, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5],
  registers: [registry]
});

const shadowLatency = new Histogram({
  name: 'ml_shadow_latency_ms',
  help: 'Shadow prediction latency in milliseconds',
  buckets: [1, 5, 10, 20, 50, 100, 200, 500, 1000],
  registers: [registry]
});

const shadowMatchRate = new Gauge({
  name: 'ml_shadow_match_rate',
  help: 'Rolling match rate between baseline and shadow',
  registers: [registry]
});

const shadowBaselineLatency = new Histogram({
  name: 'ml_baseline_latency_ms',
  help: 'Baseline prediction latency in milliseconds',
  buckets: [1, 5, 10, 20, 50, 100],
  registers: [registry]
});

/**
 * Baseline prediction (simple heuristic)
 */
function baselinePredict(snapshot) {
  if (!snapshot) return 0.5;
  
  const { mid = 0, spreadBp = 0, vol1m = 0, rsi14 = 50 } = snapshot;
  
  let score = 0.5;
  
  if (rsi14 > 70) score += 0.1;
  if (rsi14 < 30) score -= 0.1;
  if (vol1m > 1e7) score += 0.05;
  if (spreadBp > 10) score -= 0.05;
  
  return Math.max(0, Math.min(1, score));
}

/**
 * Shadow prediction (ML Engine call)
 */
async function shadowPredict(snapshot) {
  const started = performance.now();
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), SHADOW_TIMEOUT_MS);
    
    const response = await fetch(`${ML_ENGINE_URL}/ml/predict`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ snapshot }),
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) {
      throw new Error(`ML Engine returned ${response.status}`);
    }
    
    const data = await response.json();
    const latency_ms = performance.now() - started;
    
    return {
      score: Number(data.score ?? 0.5),
      latency_ms
    };
    
  } catch (error) {
    const errorType = error.name || 'unknown';
    shadowError.inc({ error_type: errorType });
    return null;
  }
}

// Create Fastify app
const app = Fastify({ logger: { level: 'info' } });

// Health endpoint
app.get('/health', async () => ({
  ok: true,
  service: 'shadow-standalone',
  ml_engine_url: ML_ENGINE_URL
}));

// Shadow prediction endpoint
app.post('/predict-with-shadow', async (request, reply) => {
  const snapshot = request.body?.snapshot;
  
  if (!snapshot) {
    return reply.code(400).send({ error: 'Missing snapshot in request body' });
  }
  
  // 1. Baseline prediction
  const baselineStart = performance.now();
  const baseline = baselinePredict(snapshot);
  const baselineLatency = performance.now() - baselineStart;
  shadowBaselineLatency.observe(baselineLatency);
  
  // 2. Shadow prediction (ML Engine)
  const shadowStart = performance.now();
  const shadowResult = await shadowPredict(snapshot);
  const shadowTotalLatency = performance.now() - shadowStart;
  shadowLatency.observe(shadowTotalLatency);
  
  let ml = null;
  let match = false;
  let delta = 0;
  
  if (shadowResult) {
    ml = shadowResult.score;
    shadowSuccess.inc();
    
    // 3. Compare predictions
    delta = Math.abs(baseline - ml);
    shadowAbsDelta.observe(delta);
    
    match = delta < MATCH_THRESHOLD;
    (match ? shadowMatchTotal : shadowMismatchTotal).inc();
    
    // 4. Update rolling match rate
    const matches = shadowMatchTotal.hashMap.get('') || 0;
    const mismatches = shadowMismatchTotal.hashMap.get('') || 0;
    const total = matches + mismatches;
    
    if (total > 0) {
      shadowMatchRate.set(matches / total);
    }
  }
  
  // 5. Return response
  return reply.send({
    prediction: baseline,
    shadow: ml,
    match,
    delta: Math.round(delta * 10000) / 10000,
    latency: {
      baseline_ms: Math.round(baselineLatency * 100) / 100,
      shadow_ms: Math.round(shadowTotalLatency * 100) / 100,
      total_ms: Math.round((baselineLatency + shadowTotalLatency) * 100) / 100
    }
  });
});

// Shadow metrics endpoint
app.get('/shadow/metrics', async () => ({
  match_rate: shadowMatchRate.get().values[0]?.value || 0,
  total_predictions: 
    (shadowMatchTotal.hashMap.get('') || 0) + 
    (shadowMismatchTotal.hashMap.get('') || 0),
  matches: shadowMatchTotal.hashMap.get('') || 0,
  mismatches: shadowMismatchTotal.hashMap.get('') || 0,
  config: {
    ml_engine_url: ML_ENGINE_URL,
    timeout_ms: SHADOW_TIMEOUT_MS,
    match_threshold: MATCH_THRESHOLD
  }
}));

// Prometheus metrics endpoint
app.get('/metrics', async (_, reply) => {
  reply.header('Content-Type', registry.contentType);
  return await registry.metrics();
});

// Start server
async function start() {
  await app.listen({ port: PORT, host: '0.0.0.0' });
  
  console.log('');
  console.log('✅ Shadow Standalone Tester Started');
  console.log(`📊 Health:  http://127.0.0.1:${PORT}/health`);
  console.log(`📊 Shadow:  http://127.0.0.1:${PORT}/predict-with-shadow`);
  console.log(`📊 Metrics: http://127.0.0.1:${PORT}/metrics`);
  console.log(`📊 Status:  http://127.0.0.1:${PORT}/shadow/metrics`);
  console.log(`🎯 ML Engine: ${ML_ENGINE_URL}`);
  console.log(`⚙️  Match Threshold: ${MATCH_THRESHOLD}`);
  console.log('');
  
  return app;
}

start().catch((err) => {
  console.error('Shadow tester failed to start:', err);
  process.exit(1);
});

