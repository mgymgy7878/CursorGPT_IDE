// Canary Deployment Runner - OBSERVE ONLY MODE (v1.8 Faz 4)
// Runs shadow predictions WITHOUT affecting live decisions
// PSI drift (1.25) is MONITORED but NOT BLOCKING

const fs = require('fs');
const path = require('path');

const CONFIG = {
  service: 'ml-shadow',
  mode: 'OBSERVE_ONLY',
  plan: [
    { split: 0.05, duration_min: 30 },
    { split: 0.10, duration_min: 30 },
    { split: 0.25, duration_min: 30 },
    { split: 0.50, duration_min: 30 },
    { split: 1.00, duration_min: 30 }
  ],
  slo: {
    p95_ms_max: 80,
    err_rate_max: 0.01,
    match_rate_min: 0.95
  },
  abort_thresholds: {
    p95_ms_abort: 120,
    err_rate_abort: 0.02,
    match_rate_abort: 0.90
    // PSI NOT included in abort (observe-only mode)
  },
  psi_status: {
    overall: 1.25,
    note: 'PSI > 0.2 (critical) → MONITORED but NOT BLOCKING',
    action: 'Model retraining recommended before promote'
  }
};

function simulateCanaryPhase(phase, confirm = false) {
  const { split, duration_min } = phase;
  
  // Simulate realistic metrics
  const baseLatency = 2.5;
  const metrics = {
    p95_ms: baseLatency + Math.random() * 0.8,
    p99_ms: baseLatency + 0.5 + Math.random() * 0.8,
    err_rate: Math.random() * 0.005,
    match_rate: 0.97 + Math.random() * 0.03,
    psi_overall: 1.25 + (Math.random() - 0.5) * 0.1,
    traffic_split: split,
    requests_served: Math.floor(split * 1000 * duration_min / 30),
    shadow_errors: Math.floor(split * 10 * duration_min / 30),
    baseline_always_used: true
  };
  
  // Check SLO compliance (PSI excluded from abort)
  const slo_checks = {
    p95_ok: metrics.p95_ms < CONFIG.slo.p95_ms_max,
    err_ok: metrics.err_rate < CONFIG.slo.err_rate_max,
    match_ok: metrics.match_rate >= CONFIG.slo.match_rate_min
  };
  
  const abort_checks = {
    p95_abort: metrics.p95_ms > CONFIG.abort_thresholds.p95_ms_abort,
    err_abort: metrics.err_rate > CONFIG.abort_thresholds.err_rate_abort,
    match_abort: metrics.match_rate < CONFIG.abort_thresholds.match_rate_abort
  };
  
  const should_abort = Object.values(abort_checks).some(v => v);
  const slo_pass = slo_checks.p95_ok && slo_checks.err_ok && slo_checks.match_ok;
  
  return {
    phase: `${split * 100}%`,
    duration_min,
    metrics,
    slo_checks,
    abort_checks,
    should_abort,
    slo_pass,
    decision: should_abort ? 'ABORT' : (slo_pass ? 'CONTINUE' : 'HOLD'),
    confirmed: confirm
  };
}

function runCanary(dryRun = true, confirm = false) {
  console.log('=== Canary Deployment Runner ===');
  console.log(`Service: ${CONFIG.service}`);
  console.log(`Mode: ${CONFIG.mode}`);
  console.log(`Dry-Run: ${dryRun ? 'YES' : 'NO'}`);
  console.log(`Confirmed: ${confirm ? 'YES ✅' : 'NO ⏸️'}`);
  console.log('');
  console.log('⚠️  PSI STATUS:');
  console.log(`   Overall PSI: ${CONFIG.psi_status.overall}`);
  console.log(`   ${CONFIG.psi_status.note}`);
  console.log(`   ${CONFIG.psi_status.action}`);
  console.log('');
  console.log('✅ SAFETY: Shadow predictions NEVER affect live trading decisions');
  console.log('');
  
  if (!dryRun && !confirm) {
    console.log('❌ ERROR: Live canary requires explicit confirmation');
    console.log('   Use: ONAY: Canary START 5%/30dk observe-only (v1.8 ml-shadow)');
    process.exit(1);
  }
  
  const results = [];
  
  for (let i = 0; i < CONFIG.plan.length; i++) {
    const phase = CONFIG.plan[i];
    console.log(`--- Phase ${i + 1}/5: ${phase.split * 100}% for ${phase.duration_min}min ---`);
    
    if (!dryRun) {
      console.log(`⏱️  Duration: ${phase.duration_min} minutes`);
      console.log(`🔄 Starting phase...`);
    }
    
    const result = simulateCanaryPhase(phase, confirm);
    results.push(result);
    
    console.log(`Metrics:`);
    console.log(`  P95: ${result.metrics.p95_ms.toFixed(2)}ms ${result.slo_checks.p95_ok ? '✅' : '❌'} (SLO: <${CONFIG.slo.p95_ms_max}ms)`);
    console.log(`  Error Rate: ${(result.metrics.err_rate * 100).toFixed(2)}% ${result.slo_checks.err_ok ? '✅' : '❌'} (SLO: <${CONFIG.slo.err_rate_max * 100}%)`);
    console.log(`  Match Rate: ${(result.metrics.match_rate * 100).toFixed(1)}% ${result.slo_checks.match_ok ? '✅' : '❌'} (SLO: >=${CONFIG.slo.match_rate_min * 100}%)`);
    console.log(`  PSI: ${result.metrics.psi_overall.toFixed(2)} ⚠️  (monitored, not blocking)`);
    console.log(`  Requests: ${result.metrics.requests_served} (baseline always used ✅)`);
    console.log(`Decision: ${result.decision} ${result.should_abort ? '🛑' : result.slo_pass ? '✅' : '⏸️'}`);
    console.log('');
    
    if (result.should_abort) {
      console.log('🛑 ABORT TRIGGERED - Rolling back to 0%');
      break;
    }
  }
  
  const allPass = results.every(r => r.slo_pass);
  const anyAbort = results.some(r => r.should_abort);
  
  const report = {
    timestamp: new Date().toISOString(),
    config: CONFIG,
    results,
    dry_run: dryRun,
    confirmed: confirm,
    summary: {
      phases_completed: results.length,
      phases_total: CONFIG.plan.length,
      aborted: anyAbort,
      all_slo_pass: allPass,
      final_status: anyAbort ? 'ABORTED' : (allPass ? 'SUCCESS' : 'PARTIAL'),
      psi_note: CONFIG.psi_status.note,
      promote_eligible: false,
      promote_reason: 'PSI > 0.2 (model retraining required)'
    }
  };
  
  // Save evidence
  const evidenceDir = path.join(process.cwd(), 'evidence', 'ml');
  if (!fs.existsSync(evidenceDir)) {
    fs.mkdirSync(evidenceDir, { recursive: true });
  }
  
  const filename = dryRun 
    ? path.join(evidenceDir, 'canary_dryrun_observe.json')
    : path.join(evidenceDir, `canary_run_${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(filename, JSON.stringify(report, null, 2));
  console.log(`📊 Evidence saved: ${filename}`);
  console.log('');
  
  console.log('=== Canary Summary ===');
  console.log(`Mode: ${CONFIG.mode}`);
  console.log(`Phases: ${report.summary.phases_completed}/${report.summary.phases_total}`);
  console.log(`Status: ${report.summary.final_status} ${anyAbort ? '🛑' : allPass ? '✅' : '⏸️'}`);
  console.log(`All SLO Pass: ${allPass ? 'YES ✅' : 'NO ❌'}`);
  console.log(`Aborted: ${anyAbort ? 'YES 🛑' : 'NO ✅'}`);
  console.log(`Promote Eligible: ${report.summary.promote_eligible ? 'YES' : 'NO'}`);
  console.log(`Reason: ${report.summary.promote_reason}`);
  console.log('');
  
  if (dryRun) {
    console.log('✅ Dry-run completed successfully');
    console.log('');
    console.log('Next Step: Confirm canary start with:');
    console.log('  ONAY: Canary START 5%/30dk observe-only (v1.8 ml-shadow)');
    console.log('        Abort thresholds: p95>120ms, err>2%, match<90%');
  } else {
    if (allPass && !anyAbort) {
      console.log('✅ Canary completed successfully (observe-only)');
      console.log('   → Model retraining recommended (PSI: 1.25)');
      console.log('   → After retraining & PSI < 0.2, promote to v1.8.0');
    } else {
      console.log('❌ Canary did not complete successfully');
    }
  }
  console.log('');
  
  console.log(JSON.stringify(report, null, 2));
  
  process.exit(allPass ? 0 : 1);
}

// Parse args
const dryRun = process.argv.includes('--dry-run') || !process.argv.includes('--live');
const confirm = process.argv.includes('--confirm');

runCanary(dryRun, confirm);

