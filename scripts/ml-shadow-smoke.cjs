// Shadow Smoke Test (v1.8 Faz 3) - 1k shadow prediction requests
// Tests: baseline vs ML match rate, latency, delta distribution
const http = require('http');

const N = Number(process.env.N || 1000);
const HOST = process.env.SHADOW_HOST || '127.0.0.1';
const PORT = Number(process.env.SHADOW_PORT || 4001);

// Generate random market snapshot
function generateSnapshot() {
  return {
    ts: Date.now(),
    mid: 40000 + Math.random() * 10000,
    spreadBp: 1 + Math.random() * 5,
    vol1m: 5e5 + Math.random() * 5e6,
    rsi14: 30 + Math.random() * 40
  };
}

const body = JSON.stringify({
  snapshot: generateSnapshot()
});

const options = {
  hostname: HOST,
  port: PORT,
  path: '/predict-with-shadow',
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'content-length': Buffer.byteLength(body)
  }
};

function makeRequest() {
  return new Promise((resolve) => {
    const start = performance.now();
    const reqBody = JSON.stringify({ snapshot: generateSnapshot() });
    
    const opts = { ...options, headers: { ...options.headers, 'content-length': Buffer.byteLength(reqBody) } };
    
    const req = http.request(opts, (resp) => {
      let data = '';
      resp.on('data', (chunk) => { data += chunk; });
      resp.on('end', () => {
        const latency = performance.now() - start;
        try {
          const parsed = JSON.parse(data);
          resolve({
            latency,
            success: resp.statusCode === 200,
            statusCode: resp.statusCode,
            baseline: parsed.prediction,
            shadow: parsed.shadow,
            match: parsed.match,
            delta: parsed.delta,
            latency_breakdown: parsed.latency
          });
        } catch (e) {
          resolve({
            latency,
            success: false,
            error: 'parse_error'
          });
        }
      });
    });
    
    req.on('error', (err) => {
      const latency = performance.now() - start;
      resolve({ latency, success: false, error: err.message });
    });
    
    req.end(reqBody);
  });
}

async function runShadowSmokeTest() {
  console.log(`=== Shadow Smoke Test (${N} requests) ===`);
  console.log(`Target: http://${HOST}:${PORT}/predict-with-shadow`);
  console.log('');
  
  const results = [];
  const startTime = Date.now();
  
  for (let i = 0; i < N; i++) {
    const result = await makeRequest();
    results.push(result);
    
    if ((i + 1) % 100 === 0) {
      process.stdout.write(`\rProgress: ${i + 1}/${N}`);
    }
  }
  
  console.log('\n');
  
  const totalTime = Date.now() - startTime;
  const latencies = results.map(r => r.latency).sort((a, b) => a - b);
  const successes = results.filter(r => r.success);
  const successRate = successes.length / N;
  
  // Match statistics
  const matches = successes.filter(r => r.match).length;
  const mismatches = successes.filter(r => !r.match && r.shadow !== null).length;
  const shadowErrors = successes.filter(r => r.shadow === null).length;
  const matchRate = matches / (matches + mismatches || 1);
  
  // Delta statistics
  const deltas = successes.filter(r => r.delta !== undefined).map(r => r.delta);
  const avgDelta = deltas.length > 0 ? deltas.reduce((a, b) => a + b, 0) / deltas.length : 0;
  const maxDelta = deltas.length > 0 ? Math.max(...deltas) : 0;
  
  // Latency statistics
  const p50 = latencies[Math.floor(0.50 * N)];
  const p95 = latencies[Math.floor(0.95 * N)];
  const p99 = latencies[Math.floor(0.99 * N)];
  const avg = latencies.reduce((a, b) => a + b, 0) / N;
  
  const report = {
    timestamp: new Date().toISOString(),
    config: { host: HOST, port: PORT, requests: N },
    latency: {
      avg_ms: Math.round(avg * 100) / 100,
      p50_ms: Math.round(p50 * 100) / 100,
      p95_ms: Math.round(p95 * 100) / 100,
      p99_ms: Math.round(p99 * 100) / 100
    },
    reliability: {
      success_count: successes.length,
      success_rate: Math.round(successRate * 10000) / 100,
      total_time_sec: Math.round(totalTime / 1000)
    },
    shadow: {
      match_count: matches,
      mismatch_count: mismatches,
      shadow_error_count: shadowErrors,
      match_rate: Math.round(matchRate * 10000) / 100,
      avg_delta: Math.round(avgDelta * 10000) / 10000,
      max_delta: Math.round(maxDelta * 10000) / 10000
    },
    slo_check: {
      p95_under_80ms: p95 < 80,
      success_rate_above_95: successRate >= 0.95,
      match_rate_above_95: matchRate >= 0.95,
      all_pass: p95 < 80 && successRate >= 0.95 && matchRate >= 0.95
    }
  };
  
  console.log('=== Results ===');
  console.log(`Requests: ${N}`);
  console.log(`Success Rate: ${report.reliability.success_rate}% (${successes.length}/${N})`);
  console.log('');
  console.log('--- Latency ---');
  console.log(`P50: ${report.latency.p50_ms}ms`);
  console.log(`P95: ${report.latency.p95_ms}ms ${p95 < 80 ? '✅' : '❌'} (SLO: <80ms)`);
  console.log(`P99: ${report.latency.p99_ms}ms`);
  console.log('');
  console.log('--- Shadow Quality ---');
  console.log(`Match Rate: ${report.shadow.match_rate}% ${matchRate >= 0.95 ? '✅' : '❌'} (SLO: >=95%)`);
  console.log(`Matches: ${matches}`);
  console.log(`Mismatches: ${mismatches}`);
  console.log(`Shadow Errors: ${shadowErrors}`);
  console.log(`Avg Delta: ${report.shadow.avg_delta}`);
  console.log(`Max Delta: ${report.shadow.max_delta}`);
  console.log('');
  console.log(`Overall SLO: ${report.slo_check.all_pass ? '✅ PASS' : '❌ FAIL'}`);
  console.log('');
  
  // Output JSON for evidence
  console.log(JSON.stringify(report, null, 2));
  
  process.exit(report.slo_check.all_pass ? 0 : 1);
}

// Check health first
const healthReq = http.request({ hostname: HOST, port: PORT, path: '/health', method: 'GET' }, (resp) => {
  if (resp.statusCode === 200) {
    console.log('✅ Shadow tester health check passed\n');
    runShadowSmokeTest().catch((err) => {
      console.error('❌ Shadow smoke test failed:', err.message);
      process.exit(1);
    });
  } else {
    console.error(`❌ Shadow tester health check failed: ${resp.statusCode}`);
    process.exit(1);
  }
});

healthReq.on('error', (err) => {
  console.error(`❌ Cannot connect to shadow tester: ${err.message}`);
  console.error(`Make sure shadow tester is running on ${HOST}:${PORT}`);
  process.exit(1);
});

healthReq.end();

