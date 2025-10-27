// Shadow Prediction Plugin (v1.8 Faz 3)
// Dual-path: Baseline (production) + ML (shadow, no impact on live decisions)
import fp from 'fastify-plugin';
import { Counter, Histogram, Gauge } from 'prom-client';

// Prometheus metrics
const shadowSuccess = new Counter({
  name: 'ml_shadow_success_total',
  help: 'Total successful shadow predictions'
});

const shadowError = new Counter({
  name: 'ml_shadow_error_total',
  help: 'Total shadow prediction errors',
  labelNames: ['error_type']
});

const shadowMatchTotal = new Counter({
  name: 'ml_shadow_match_total',
  help: 'Total matches between baseline and shadow'
});

const shadowMismatchTotal = new Counter({
  name: 'ml_shadow_mismatch_total',
  help: 'Total mismatches between baseline and shadow'
});

const shadowAbsDelta = new Histogram({
  name: 'ml_shadow_abs_delta',
  help: 'Absolute delta between baseline and shadow predictions',
  buckets: [0.001, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5]
});

const shadowLatency = new Histogram({
  name: 'ml_shadow_latency_ms',
  help: 'Shadow prediction latency in milliseconds',
  buckets: [1, 5, 10, 20, 50, 100, 200, 500, 1000]
});

const shadowMatchRate = new Gauge({
  name: 'ml_shadow_match_rate',
  help: 'Rolling match rate between baseline and shadow'
});

const shadowBaselineLatency = new Histogram({
  name: 'ml_baseline_latency_ms',
  help: 'Baseline prediction latency in milliseconds',
  buckets: [1, 5, 10, 20, 50, 100]
});

// Configuration
const ML_ENGINE_URL = process.env.ML_ENGINE_URL || 'http://127.0.0.1:4010';
const SHADOW_TIMEOUT_MS = Number(process.env.SHADOW_TIMEOUT_MS || 60);
const MATCH_THRESHOLD = Number(process.env.SHADOW_MATCH_THRESHOLD || 0.05);

/**
 * Baseline prediction (deterministic rule-based)
 * TODO: Replace with your actual production baseline logic
 */
function baselinePredict(snapshot: any): number {
  if (!snapshot) return 0.5;
  
  // Simple heuristic example (replace with actual logic)
  const { mid = 0, spreadBp = 0, vol1m = 0, rsi14 = 50 } = snapshot;
  
  // Example: score based on RSI and volume
  let score = 0.5;
  
  if (rsi14 > 70) score += 0.1; // Overbought
  if (rsi14 < 30) score -= 0.1; // Oversold
  if (vol1m > 1e7) score += 0.05; // High volume
  if (spreadBp > 10) score -= 0.05; // Wide spread
  
  // Clip to [0, 1]
  return Math.max(0, Math.min(1, score));
}

/**
 * Shadow prediction (ML Engine call)
 */
async function shadowPredict(snapshot: any): Promise<{ score: number; latency_ms: number } | null> {
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
    const errorType = error instanceof Error ? error.name : 'unknown';
    shadowError.inc({ error_type: errorType });
    return null;
  }
}

/**
 * Shadow plugin - Dual prediction path
 */
export default fp(async (app) => {
  app.log.info('🔄 Shadow Prediction Plugin loading...');
  
  // Shadow prediction endpoint
  app.post('/predict-with-shadow', async (request, reply) => {
    const snapshot = request.body?.snapshot;
    
    if (!snapshot) {
      return reply.code(400).send({ error: 'Missing snapshot in request body' });
    }
    
    // 1. Baseline prediction (always runs, production path)
    const baselineStart = performance.now();
    const baseline = baselinePredict(snapshot);
    const baselineLatency = performance.now() - baselineStart;
    shadowBaselineLatency.observe(baselineLatency);
    
    // 2. Shadow prediction (ML Engine, isolated failure)
    const shadowStart = performance.now();
    const shadowResult = await shadowPredict(snapshot);
    const shadowTotalLatency = performance.now() - shadowStart;
    shadowLatency.observe(shadowTotalLatency);
    
    let ml: number | null = null;
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
      const matches = (shadowMatchTotal as any).hashMap?.get('') || 0;
      const mismatches = (shadowMismatchTotal as any).hashMap?.get('') || 0;
      const total = matches + mismatches;
      
      if (total > 0) {
        shadowMatchRate.set(matches / total);
      }
    }
    
    // 5. Return response (ONLY baseline affects live decisions)
    return reply.send({
      prediction: baseline,      // Production value (always used)
      shadow: ml,               // ML prediction (for monitoring only)
      match,                    // Whether predictions match
      delta,                    // Absolute difference
      latency: {
        baseline_ms: Math.round(baselineLatency * 100) / 100,
        shadow_ms: Math.round(shadowTotalLatency * 100) / 100,
        total_ms: Math.round((baselineLatency + shadowTotalLatency) * 100) / 100
      }
    });
  });
  
  // Shadow metrics endpoint (for debugging)
  app.get('/shadow/metrics', async () => ({
    match_rate: shadowMatchRate.get().values[0]?.value || 0,
    total_predictions: 
      ((shadowMatchTotal as any).hashMap?.get('') || 0) + 
      ((shadowMismatchTotal as any).hashMap?.get('') || 0),
    matches: (shadowMatchTotal as any).hashMap?.get('') || 0,
    mismatches: (shadowMismatchTotal as any).hashMap?.get('') || 0,
    errors: (shadowError as any).hashMap?.all || 0,
    config: {
      ml_engine_url: ML_ENGINE_URL,
      timeout_ms: SHADOW_TIMEOUT_MS,
      match_threshold: MATCH_THRESHOLD
    }
  }));
  
  app.log.info({ ml_engine_url: ML_ENGINE_URL }, '✅ Shadow Prediction Plugin registered');
}, {
  name: 'shadow-prediction-plugin',
  fastify: '^5.0.0'
});

