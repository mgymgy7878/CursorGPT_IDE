#!/usr/bin/env node
/**
 * Backtest Status API Smoke Test
 * Tests GET /api/backtest/status endpoint
 * Saves evidence to evidence/observability/
 */

const fs = require('fs');
const path = require('path');

const EXECUTOR_URL = process.env.EXECUTOR_URL || 'http://127.0.0.1:4001';
const EVIDENCE_DIR = path.join(__dirname, '..', 'evidence', 'observability');

async function smokeTest() {
  console.log('🧪 Backtest Status API Smoke Test');
  console.log(`Target: ${EXECUTOR_URL}/api/backtest/status\n`);

  let exitCode = 0;
  const results = {
    timestamp: new Date().toISOString(),
    url: `${EXECUTOR_URL}/api/backtest/status`,
    success: false,
    error: null,
    response: null,
    validation: {
      schema: false,
      stats: false,
      runs: false,
    },
  };

  try {
    // 1. GET /api/backtest/status
    console.log('📡 Fetching status...');
    const res = await fetch(`${EXECUTOR_URL}/api/backtest/status`);
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    results.response = data;
    
    // 2. Validate response schema
    console.log('✅ Response received');
    
    if (data.runs && Array.isArray(data.runs)) {
      results.validation.runs = true;
      console.log(`   Runs: ${data.runs.length}`);
    } else {
      console.warn('⚠️  Missing or invalid "runs" array');
    }
    
    if (data.stats && typeof data.stats === 'object') {
      results.validation.stats = true;
      console.log(`   Stats: total=${data.stats.total}, running=${data.stats.running}, done=${data.stats.done}, failed=${data.stats.failed}`);
      
      if (data.stats.p50DurationSec !== undefined) {
        console.log(`   P50 Duration: ${data.stats.p50DurationSec.toFixed(2)}s`);
      }
      if (data.stats.p95DurationSec !== undefined) {
        console.log(`   P95 Duration: ${data.stats.p95DurationSec.toFixed(2)}s`);
      }
    } else {
      console.warn('⚠️  Missing or invalid "stats" object');
    }
    
    results.validation.schema = results.validation.runs && results.validation.stats;
    
    // 3. Check for sample run detail (if runs exist)
    if (data.runs && data.runs.length > 0) {
      const firstRun = data.runs[0];
      console.log(`\n📋 Sample Run: ${firstRun.id}`);
      console.log(`   Status: ${firstRun.status}`);
      console.log(`   Started: ${new Date(firstRun.startedAt).toISOString()}`);
      if (firstRun.finishedAt) {
        console.log(`   Finished: ${new Date(firstRun.finishedAt).toISOString()}`);
      }
      if (firstRun.metrics) {
        console.log(`   Metrics:`, JSON.stringify(firstRun.metrics, null, 2).split('\n').map((l, i) => i === 0 ? l : `     ${l}`).join('\n'));
      }
    }
    
    // 4. Success
    results.success = true;
    console.log('\n✅ Smoke test PASSED');
    
  } catch (err) {
    console.error('\n❌ Smoke test FAILED');
    console.error(err);
    results.error = err.message;
    results.success = false;
    exitCode = 1;
  }

  // 5. Save evidence
  try {
    await fs.promises.mkdir(EVIDENCE_DIR, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, -5);
    const evidenceFile = path.join(EVIDENCE_DIR, `backtest_status_${timestamp}.json`);
    await fs.promises.writeFile(evidenceFile, JSON.stringify(results, null, 2));
    console.log(`\n💾 Evidence saved: ${path.relative(process.cwd(), evidenceFile)}`);
  } catch (err) {
    console.warn('⚠️  Failed to save evidence:', err.message);
  }

  // 6. TL;DR
  console.log('\n📊 TL;DR:');
  console.log(`   Success: ${results.success ? '✅ YES' : '❌ NO'}`);
  console.log(`   Runs: ${results.response?.runs?.length ?? 0}`);
  console.log(`   Running: ${results.response?.stats?.running ?? 0}`);
  console.log(`   Done: ${results.response?.stats?.done ?? 0}`);
  console.log(`   Failed: ${results.response?.stats?.failed ?? 0}`);
  console.log(`   P95 Duration: ${results.response?.stats?.p95DurationSec != null ? `${results.response.stats.p95DurationSec.toFixed(2)}s` : 'n/a'}`);
  
  process.exit(exitCode);
}

smokeTest();

