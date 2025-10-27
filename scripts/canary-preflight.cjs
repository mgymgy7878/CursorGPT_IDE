// Canary Pre-Flight Metrics Snapshot (v1.8 Faz 4)
// Collects baseline metrics before canary deployment
const http = require('http');
const fs = require('fs');
const path = require('path');

const ML_ENGINE_HOST = process.env.ML_ENGINE_HOST || '127.0.0.1';
const ML_ENGINE_PORT = Number(process.env.ML_ENGINE_PORT || 4010);

function fetchMetrics(host, port, endpoint) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: host,
      port,
      path: endpoint,
      method: 'GET'
    }, (resp) => {
      let data = '';
      resp.on('data', (chunk) => { data += chunk; });
      resp.on('end', () => {
        if (resp.statusCode === 200) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${resp.statusCode}`));
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
    
    req.end();
  });
}

function parsePrometheusMetrics(metricsText) {
  const lines = metricsText.split('\n');
  const metrics = {};
  
  for (const line of lines) {
    if (line.startsWith('#') || !line.trim()) continue;
    
    // Extract metric name and value
    const match = line.match(/^([a-z_]+)(\{[^}]*\})?\s+(.+)$/);
    if (match) {
      const [, name, labels, value] = match;
      if (!metrics[name]) metrics[name] = [];
      metrics[name].push({ labels, value: parseFloat(value) || value });
    }
  }
  
  return metrics;
}

function calculateP95(buckets) {
  // Simple P95 estimation from histogram buckets
  let total = 0;
  for (const b of buckets) {
    if (b.le !== '+Inf') total += b.count;
  }
  
  const p95Index = Math.floor(0.95 * total);
  let cumulative = 0;
  
  for (const b of buckets) {
    cumulative += b.count;
    if (cumulative >= p95Index) {
      return parseFloat(b.le);
    }
  }
  
  return 0;
}

async function runPreFlight() {
  console.log('=== Canary Pre-Flight Metrics Snapshot ===');
  console.log(`Target: http://${ML_ENGINE_HOST}:${ML_ENGINE_PORT}/ml/metrics`);
  console.log('');
  
  try {
    // Fetch metrics
    const metricsText = await fetchMetrics(ML_ENGINE_HOST, ML_ENGINE_PORT, '/ml/metrics');
    const metrics = parsePrometheusMetrics(metricsText);
    
    // Extract key metrics
    const predictRequests = metrics['ml_predict_requests_total'] || [];
    const predictLatencyBuckets = metrics['ml_predict_latency_ms_bucket'] || [];
    const modelErrors = metrics['ml_model_errors_total'] || [];
    
    // Calculate totals
    const totalRequests = predictRequests.reduce((sum, m) => sum + (m.value || 0), 0);
    const totalErrors = modelErrors.reduce((sum, m) => sum + (m.value || 0), 0);
    const errorRate = totalRequests > 0 ? totalErrors / totalRequests : 0;
    
    // Parse latency buckets
    const buckets = predictLatencyBuckets
      .map(m => {
        const leMatch = m.labels?.match(/le="([^"]+)"/);
        const le = leMatch ? leMatch[1] : '+Inf';
        return { le, count: m.value || 0 };
      })
      .sort((a, b) => {
        if (a.le === '+Inf') return 1;
        if (b.le === '+Inf') return -1;
        return parseFloat(a.le) - parseFloat(b.le);
      });
    
    const p95 = buckets.length > 0 ? calculateP95(buckets) : 0;
    
    // Build report
    const report = {
      timestamp: new Date().toISOString(),
      service: 'ml-engine',
      endpoint: `http://${ML_ENGINE_HOST}:${ML_ENGINE_PORT}`,
      baseline_metrics: {
        total_requests: totalRequests,
        total_errors: totalErrors,
        error_rate: Math.round(errorRate * 10000) / 100,
        latency_p95_ms: p95
      },
      slo_compliance: {
        error_rate_under_1pct: errorRate < 0.01,
        latency_p95_under_80ms: p95 < 80
      },
      raw_metrics_sample: {
        predict_requests_total: totalRequests,
        model_errors_total: totalErrors,
        latency_buckets_count: buckets.length
      }
    };
    
    // Print report
    console.log('--- Baseline Metrics ---');
    console.log(`Total Requests: ${report.baseline_metrics.total_requests}`);
    console.log(`Total Errors: ${report.baseline_metrics.total_errors}`);
    console.log(`Error Rate: ${report.baseline_metrics.error_rate}% ${report.slo_compliance.error_rate_under_1pct ? '✅' : '❌'} (SLO: <1%)`);
    console.log(`Latency P95: ${report.baseline_metrics.latency_p95_ms}ms ${report.slo_compliance.latency_p95_under_80ms ? '✅' : '❌'} (SLO: <80ms)`);
    console.log('');
    console.log(`Pre-Flight Status: ${report.slo_compliance.error_rate_under_1pct && report.slo_compliance.latency_p95_under_80ms ? '✅ PASS' : '❌ FAIL'}`);
    console.log('');
    
    // Save evidence
    const evidenceDir = path.join(process.cwd(), 'evidence', 'ml');
    if (!fs.existsSync(evidenceDir)) {
      fs.mkdirSync(evidenceDir, { recursive: true });
    }
    
    const filename = path.join(evidenceDir, 'canary_preflight.json');
    fs.writeFileSync(filename, JSON.stringify(report, null, 2));
    console.log(`📊 Evidence saved: ${filename}`);
    console.log('');
    
    // Save full metrics
    const metricsFilename = path.join(evidenceDir, 'canary_preflight_metrics.txt');
    fs.writeFileSync(metricsFilename, metricsText);
    console.log(`📊 Full metrics: ${metricsFilename}`);
    console.log('');
    
    // Output JSON
    console.log(JSON.stringify(report, null, 2));
    
    const allPass = report.slo_compliance.error_rate_under_1pct && report.slo_compliance.latency_p95_under_80ms;
    process.exit(allPass ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Pre-flight failed:', error.message);
    process.exit(1);
  }
}

runPreFlight();

