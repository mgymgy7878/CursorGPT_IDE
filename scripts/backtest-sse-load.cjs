#!/usr/bin/env node
/**
 * Backtest SSE Load Test
 * Spawns N concurrent EventSource clients for M seconds
 * Measures: first-event latency, errors, reconnects, gauge max
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const EXECUTOR_URL = process.env.EXECUTOR_URL || 'http://127.0.0.1:4001';
const EVIDENCE_DIR = path.join(__dirname, '..', 'evidence', 'observability');
const NUM_CLIENTS = parseInt(process.env.LOAD_CLIENTS || '20', 10);
const DURATION_SEC = parseInt(process.env.LOAD_DURATION || '60', 10);

const results = {
  timestamp: new Date().toISOString(),
  url: `${EXECUTOR_URL}/api/backtest/stream`,
  clients: NUM_CLIENTS,
  durationSec: DURATION_SEC,
  firstEventLatencyMs: [],
  errors: 0,
  reconnects: 0,
  gaugeMax: 0,
  success: true,
};

console.log(`🧪 Backtest SSE Load Test`);
console.log(`   Clients: ${NUM_CLIENTS}`);
console.log(`   Duration: ${DURATION_SEC}s`);
console.log(`   Target: ${EXECUTOR_URL}/api/backtest/stream\n`);

function connectClient(clientId) {
  return new Promise((resolve) => {
    const urlObj = new URL(`${EXECUTOR_URL}/api/backtest/stream`);
    const startTime = Date.now();
    let firstEventReceived = false;
    let errorCount = 0;

    const req = http.get({
      hostname: urlObj.hostname,
      port: urlObj.port || 80,
      path: urlObj.pathname,
      headers: { 'Accept': 'text/event-stream' },
    }, (res) => {
      if (res.statusCode !== 200) {
        results.errors++;
        console.error(`[Client ${clientId}] ❌ HTTP ${res.statusCode}`);
        resolve({ clientId, latency: -1, error: true });
        return;
      }

      let buffer = '';

      res.on('data', (chunk) => {
        if (!firstEventReceived) {
          const latency = Date.now() - startTime;
          results.firstEventLatencyMs.push(latency);
          firstEventReceived = true;
          console.log(`[Client ${clientId}] ✅ First event in ${latency}ms`);
        }

        buffer += chunk.toString();
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const block of lines) {
          if (!block.trim() || block.startsWith(':')) continue;

          const eventMatch = block.match(/event:\s*(\w+)/);
          if (eventMatch && eventMatch[1] === 'snapshot') {
            // Successfully received snapshot
          }
        }
      });

      res.on('error', (err) => {
        errorCount++;
        results.errors++;
        console.error(`[Client ${clientId}] ⚠️  Stream error:`, err.message);
      });

      res.on('end', () => {
        if (errorCount > 0) {
          results.reconnects++;
        }
        resolve({ clientId, latency: firstEventReceived ? results.firstEventLatencyMs[results.firstEventLatencyMs.length - 1] : -1 });
      });
    });

    req.on('error', (err) => {
      results.errors++;
      console.error(`[Client ${clientId}] ❌ Connection error:`, err.message);
      resolve({ clientId, latency: -1, error: true });
    });

    // Cleanup after duration
    setTimeout(() => {
      req.destroy();
    }, DURATION_SEC * 1000);
  });
}

async function queryGaugeMax() {
  return new Promise((resolve) => {
    const urlObj = new URL(`${EXECUTOR_URL}/metrics`);
    http.get({
      hostname: urlObj.hostname,
      port: urlObj.port || 80,
      path: urlObj.pathname,
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        const match = body.match(/backtest_stream_clients\s+([\d.]+)/);
        if (match) {
          const val = parseFloat(match[1]);
          resolve(val);
        } else {
          resolve(0);
        }
      });
    }).on('error', () => resolve(0));
  });
}

async function runLoadTest() {
  console.log('🚀 Starting load test...\n');
  
  // Start all clients concurrently
  const clients = [];
  for (let i = 1; i <= NUM_CLIENTS; i++) {
    clients.push(connectClient(i));
  }

  // Poll gauge every 2s
  const gaugeInterval = setInterval(async () => {
    const current = await queryGaugeMax();
    if (current > results.gaugeMax) {
      results.gaugeMax = current;
    }
    process.stdout.write(`\r📊 Live clients gauge: ${current} (max: ${results.gaugeMax})  `);
  }, 2000);

  // Wait for all clients to finish
  await Promise.all(clients);
  clearInterval(gaugeInterval);
  
  console.log('\n\n✅ Load test completed\n');

  // Calculate percentiles
  const latencies = results.firstEventLatencyMs.filter(l => l > 0).sort((a, b) => a - b);
  
  if (latencies.length > 0) {
    const p50Idx = Math.floor(latencies.length * 0.5);
    const p95Idx = Math.floor(latencies.length * 0.95);
    const p99Idx = Math.floor(latencies.length * 0.99);
    
    results.firstEventLatencyMs = {
      p50: latencies[p50Idx],
      p95: latencies[p95Idx],
      p99: latencies[p99Idx],
      max: latencies[latencies.length - 1],
      min: latencies[0],
      count: latencies.length,
    };
  } else {
    results.success = false;
    results.firstEventLatencyMs = { error: 'No successful connections' };
  }

  // Save evidence
  try {
    fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, -5);
    const evidenceFile = path.join(EVIDENCE_DIR, `sse_load_${timestamp}.json`);
    fs.writeFileSync(evidenceFile, JSON.stringify(results, null, 2));
    console.log(`💾 Evidence saved: ${path.relative(process.cwd(), evidenceFile)}`);
  } catch (err) {
    console.warn('⚠️  Failed to save evidence:', err.message);
  }

  // Print summary
  console.log('\n📊 LOAD TEST SUMMARY:');
  console.log(`   Clients: ${results.clients}`);
  console.log(`   Duration: ${results.durationSec}s`);
  console.log(`   First Event Latency:`);
  console.log(`     P50: ${results.firstEventLatencyMs.p50}ms`);
  console.log(`     P95: ${results.firstEventLatencyMs.p95}ms`);
  console.log(`     P99: ${results.firstEventLatencyMs.p99}ms`);
  console.log(`     Max: ${results.firstEventLatencyMs.max}ms`);
  console.log(`   Errors: ${results.errors}`);
  console.log(`   Reconnects: ${results.reconnects}`);
  console.log(`   Gauge Max: ${results.gaugeMax}`);
  console.log(`   Success: ${results.success ? '✅ YES' : '❌ NO'}`);

  // SLO validation
  const p95Target = 1500; // 1.5s
  const errorRateTarget = 0.01; // 1%
  
  const errorRate = results.errors / results.clients;
  const p95Pass = results.firstEventLatencyMs.p95 <= p95Target;
  const errorPass = errorRate < errorRateTarget;
  
  console.log(`\n🎯 SLO VALIDATION:`);
  console.log(`   P95 ≤ 1.5s: ${p95Pass ? '✅ PASS' : '❌ FAIL'} (${results.firstEventLatencyMs.p95}ms)`);
  console.log(`   Error Rate < 1%: ${errorPass ? '✅ PASS' : '❌ FAIL'} (${(errorRate * 100).toFixed(2)}%)`);
  
  if (p95Pass && errorPass) {
    console.log('\n✅ All SLOs met - SSE stream is production-ready');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some SLOs not met - review results');
    process.exit(1);
  }
}

runLoadTest().catch(err => {
  console.error('❌ Load test failed:', err);
  process.exit(1);
});

