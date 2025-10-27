// ML Smoke Test (v1.8) - 1k prediction requests
// Measures: p50, p95, p99 latency, success rate
const http = require('http');

const N = 1000;
const HOST = process.env.ML_HOST || '127.0.0.1';
const PORT = Number(process.env.ML_PORT || 4010);

const body = JSON.stringify({
  symbol: 'BTCUSDT',
  snapshot: {
    ts: Date.now(),
    mid: 45000,
    spreadBp: 2,
    vol1m: 1e6,
    rsi14: 55
  }
});

const options = {
  hostname: HOST,
  port: PORT,
  path: '/ml/predict',
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'content-length': Buffer.byteLength(body)
  }
};

function makeRequest() {
  return new Promise((resolve) => {
    const start = performance.now();
    
    const req = http.request(options, (resp) => {
      let data = '';
      resp.on('data', (chunk) => { data += chunk; });
      resp.on('end', () => {
        const latency = performance.now() - start;
        const success = resp.statusCode === 200;
        resolve({ latency, success, statusCode: resp.statusCode });
      });
    });
    
    req.on('error', (err) => {
      const latency = performance.now() - start;
      resolve({ latency, success: false, error: err.message });
    });
    
    req.end(body);
  });
}

async function runSmokeTest() {
  console.log(`=== ML Smoke Test (${N} requests) ===`);
  console.log(`Target: http://${HOST}:${PORT}/ml/predict`);
  console.log('');
  
  const results = [];
  const startTime = Date.now();
  
  // Sequential requests to avoid overwhelming
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
  const successes = results.filter(r => r.success).length;
  const successRate = successes / N;
  
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
      success_count: successes,
      success_rate: Math.round(successRate * 10000) / 100,
      total_time_sec: Math.round(totalTime / 1000)
    },
    slo_check: {
      p95_under_80ms: p95 < 80,
      success_rate_above_95: successRate >= 0.95
    }
  };
  
  console.log('=== Results ===');
  console.log(`Requests: ${N}`);
  console.log(`Success Rate: ${report.reliability.success_rate}% (${successes}/${N})`);
  console.log(`Latency P50: ${report.latency.p50_ms}ms`);
  console.log(`Latency P95: ${report.latency.p95_ms}ms ${p95 < 80 ? '✅' : '❌ (SLO: <80ms)'}`);
  console.log(`Latency P99: ${report.latency.p99_ms}ms`);
  console.log(`Total Time: ${report.reliability.total_time_sec}s`);
  console.log('');
  console.log(`SLO Check: ${report.slo_check.p95_under_80ms && report.slo_check.success_rate_above_95 ? '✅ PASS' : '❌ FAIL'}`);
  console.log('');
  
  // Output JSON for evidence
  console.log(JSON.stringify(report, null, 2));
  
  process.exit(report.slo_check.p95_under_80ms && report.slo_check.success_rate_above_95 ? 0 : 1);
}

// Check health first
const healthReq = http.request({ hostname: HOST, port: PORT, path: '/ml/health', method: 'GET' }, (resp) => {
  if (resp.statusCode === 200) {
    console.log('✅ ML Engine health check passed\n');
    runSmokeTest().catch((err) => {
      console.error('❌ Smoke test failed:', err.message);
      process.exit(1);
    });
  } else {
    console.error(`❌ ML Engine health check failed: ${resp.statusCode}`);
    process.exit(1);
  }
});

healthReq.on('error', (err) => {
  console.error(`❌ Cannot connect to ML Engine: ${err.message}`);
  console.error(`Make sure ML Engine is running on ${HOST}:${PORT}`);
  process.exit(1);
});

healthReq.end();

