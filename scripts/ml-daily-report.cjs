// ML Daily Risk Report (v1.8+)
// Automated daily monitoring: PSI, latency, errors, match rate
// Outputs: CSV + JSON for artifact store

const fs = require('fs');
const path = require('path');
const http = require('http');

const LOOKBACK_DAYS = Number(process.env.LOOKBACK_DAYS || 1);
const ML_ENGINE_HOST = process.env.ML_ENGINE_HOST || '127.0.0.1';
const ML_ENGINE_PORT = Number(process.env.ML_ENGINE_PORT || 4010);
const OUTPUT_DIR = path.join(process.cwd(), 'evidence', 'ml', 'daily');

function fetchMetrics(host, port, endpoint) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: host,
      port,
      path: endpoint,
      method: 'GET',
      timeout: 5000
    }, (resp) => {
      let data = '';
      resp.on('data', (chunk) => { data += chunk; });
      resp.on('end', () => {
        if (resp.statusCode === 200) resolve(data);
        else reject(new Error(`HTTP ${resp.statusCode}`));
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

function parseMetrics(metricsText) {
  const metrics = {
    predict_requests: 0,
    model_errors: 0,
    shadow_matches: 0,
    shadow_mismatches: 0,
    shadow_errors: 0
  };
  
  const lines = metricsText.split('\n');
  
  for (const line of lines) {
    if (line.includes('ml_predict_requests_total{') && line.includes('status="success"')) {
      const match = line.match(/(\d+(?:\.\d+)?)$/);
      if (match) metrics.predict_requests = parseFloat(match[1]);
    }
    if (line.includes('ml_model_errors_total ')) {
      const match = line.match(/(\d+(?:\.\d+)?)$/);
      if (match) metrics.model_errors = parseFloat(match[1]);
    }
    if (line.includes('ml_shadow_match_total ')) {
      const match = line.match(/(\d+(?:\.\d+)?)$/);
      if (match) metrics.shadow_matches = parseFloat(match[1]);
    }
    if (line.includes('ml_shadow_mismatch_total ')) {
      const match = line.match(/(\d+(?:\.\d+)?)$/);
      if (match) metrics.shadow_mismatches = parseFloat(match[1]);
    }
    if (line.includes('ml_shadow_error_total ')) {
      const match = line.match(/(\d+(?:\.\d+)?)$/);
      if (match) metrics.shadow_errors = parseFloat(match[1]);
    }
  }
  
  return metrics;
}

async function generateDailyReport() {
  const timestamp = new Date().toISOString();
  const dateStr = new Date().toISOString().split('T')[0];
  
  console.log('=== ML Daily Risk Report ===');
  console.log(`Date: ${dateStr}`);
  console.log(`Lookback: ${LOOKBACK_DAYS} day(s)`);
  console.log('');
  
  try {
    // Fetch current metrics
    console.log('Fetching metrics from ML Engine...');
    const metricsText = await fetchMetrics(ML_ENGINE_HOST, ML_ENGINE_PORT, '/ml/metrics');
    const metrics = parseMetrics(metricsText);
    
    // Calculate rates
    const totalPredictions = metrics.predict_requests;
    const errorRate = totalPredictions > 0 ? metrics.model_errors / totalPredictions : 0;
    const shadowTotal = metrics.shadow_matches + metrics.shadow_mismatches;
    const matchRate = shadowTotal > 0 ? metrics.shadow_matches / shadowTotal : 0;
    const shadowErrorRate = totalPredictions > 0 ? metrics.shadow_errors / totalPredictions : 0;
    
    // Load PSI snapshot
    let psiScore = null;
    try {
      const psiData = fs.readFileSync('evidence/ml/psi_snapshot.json', 'utf-8');
      const psi = JSON.parse(psiData);
      psiScore = psi.overall_psi;
    } catch (e) {
      console.warn('⚠️  PSI snapshot not found, using default');
      psiScore = 1.25; // Current known value
    }
    
    // Risk assessment
    const risks = [];
    
    if (psiScore > 0.3) risks.push({ level: 'CRITICAL', metric: 'PSI', value: psiScore, threshold: 0.3, action: 'Immediate retraining' });
    else if (psiScore > 0.2) risks.push({ level: 'HIGH', metric: 'PSI', value: psiScore, threshold: 0.2, action: 'Plan retraining' });
    else if (psiScore > 0.15) risks.push({ level: 'MEDIUM', metric: 'PSI', value: psiScore, threshold: 0.15, action: 'Monitor' });
    
    if (errorRate > 0.01) risks.push({ level: 'HIGH', metric: 'Error Rate', value: errorRate, threshold: 0.01, action: 'Investigate errors' });
    if (matchRate < 0.90) risks.push({ level: 'CRITICAL', metric: 'Match Rate', value: matchRate, threshold: 0.90, action: 'Check shadow logic' });
    else if (matchRate < 0.95) risks.push({ level: 'MEDIUM', metric: 'Match Rate', value: matchRate, threshold: 0.95, action: 'Monitor shadow' });
    
    // Build report
    const report = {
      date: dateStr,
      timestamp,
      lookback_days: LOOKBACK_DAYS,
      metrics: {
        total_predictions: totalPredictions,
        model_errors: metrics.model_errors,
        error_rate: Math.round(errorRate * 10000) / 100,
        shadow_matches: metrics.shadow_matches,
        shadow_mismatches: metrics.shadow_mismatches,
        shadow_errors: metrics.shadow_errors,
        shadow_match_rate: Math.round(matchRate * 10000) / 100,
        shadow_error_rate: Math.round(shadowErrorRate * 10000) / 100,
        psi_score: psiScore
      },
      slo_compliance: {
        error_rate_ok: errorRate < 0.01,
        match_rate_ok: matchRate >= 0.95,
        psi_ok: psiScore < 0.2
      },
      risks,
      overall_status: risks.some(r => r.level === 'CRITICAL') ? 'CRITICAL' : 
                     risks.some(r => r.level === 'HIGH') ? 'HIGH' :
                     risks.some(r => r.level === 'MEDIUM') ? 'MEDIUM' : 'HEALTHY',
      promote_eligible: risks.length === 0 || !risks.some(r => r.metric === 'PSI' && r.level !== 'MEDIUM')
    };
    
    // Print report
    console.log('--- Metrics Summary ---');
    console.log(`Total Predictions: ${report.metrics.total_predictions}`);
    console.log(`Error Rate: ${report.metrics.error_rate}% ${report.slo_compliance.error_rate_ok ? '✅' : '❌'}`);
    console.log(`Shadow Match Rate: ${report.metrics.shadow_match_rate}% ${report.slo_compliance.match_rate_ok ? '✅' : '❌'}`);
    console.log(`Shadow Error Rate: ${report.metrics.shadow_error_rate}%`);
    console.log(`PSI Score: ${report.metrics.psi_score} ${report.slo_compliance.psi_ok ? '✅' : '❌'}`);
    console.log('');
    
    console.log('--- Risk Assessment ---');
    if (risks.length === 0) {
      console.log('✅ No risks identified');
    } else {
      for (const risk of risks) {
        const icon = risk.level === 'CRITICAL' ? '🔴' : risk.level === 'HIGH' ? '🟠' : '🟡';
        console.log(`${icon} ${risk.level}: ${risk.metric} = ${risk.value.toFixed(4)} (threshold: ${risk.threshold})`);
        console.log(`   Action: ${risk.action}`);
      }
    }
    console.log('');
    
    console.log(`Overall Status: ${report.overall_status} ${report.overall_status === 'HEALTHY' ? '✅' : report.overall_status === 'MEDIUM' ? '⚠️' : '❌'}`);
    console.log(`Promote Eligible: ${report.promote_eligible ? 'YES ✅' : 'NO ❌'}`);
    console.log('');
    
    // Save JSON
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    
    const jsonFile = path.join(OUTPUT_DIR, `report_${dateStr}.json`);
    fs.writeFileSync(jsonFile, JSON.stringify(report, null, 2));
    console.log(`📊 JSON report: ${jsonFile}`);
    
    // Save CSV
    const csvFile = path.join(OUTPUT_DIR, `report_${dateStr}.csv`);
    const csvHeaders = 'date,total_predictions,error_rate,match_rate,psi_score,status,promote_eligible\n';
    const csvRow = `${dateStr},${totalPredictions},${report.metrics.error_rate},${report.metrics.shadow_match_rate},${psiScore},${report.overall_status},${report.promote_eligible}\n`;
    
    // Append to cumulative CSV
    const cumulativeCsv = path.join(OUTPUT_DIR, 'ml_daily_reports.csv');
    if (!fs.existsSync(cumulativeCsv)) {
      fs.writeFileSync(cumulativeCsv, csvHeaders);
    }
    fs.appendFileSync(cumulativeCsv, csvRow);
    
    fs.writeFileSync(csvFile, csvHeaders + csvRow);
    console.log(`📊 CSV report: ${csvFile}`);
    console.log(`📊 Cumulative: ${cumulativeCsv}`);
    console.log('');
    
    // Output JSON
    console.log(JSON.stringify(report, null, 2));
    
    process.exit(report.overall_status === 'HEALTHY' ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Daily report failed:', error.message);
    
    const errorReport = {
      date: dateStr,
      timestamp,
      error: error.message,
      status: 'ERROR'
    };
    
    const errorFile = path.join(OUTPUT_DIR, `report_${dateStr}_error.json`);
    fs.writeFileSync(errorFile, JSON.stringify(errorReport, null, 2));
    
    process.exit(1);
  }
}

generateDailyReport();

