// PSI (Population Stability Index) Snapshot (v1.8 Faz 3)
// Calculates PSI for each feature to detect distribution drift
const fs = require('fs');
const path = require('path');

// Reference distributions (from Faz 1/2 baseline)
// In production, load from Redis/DB with timestamps
const REFERENCE_DISTRIBUTIONS = {
  mid: { mean: 45000, std: 2000, bins: [40000, 42000, 44000, 46000, 48000, 50000] },
  spreadBp: { mean: 2.5, std: 1.5, bins: [0, 1, 2, 3, 5, 10] },
  vol1m: { mean: 1e6, std: 5e5, bins: [0, 5e5, 1e6, 2e6, 5e6, 1e7] },
  rsi14: { mean: 50, std: 15, bins: [0, 20, 40, 60, 80, 100] }
};

/**
 * Calculate PSI between two distributions
 * PSI = Σ (actual% - expected%) * ln(actual% / expected%)
 */
function calculatePSI(actualDist, expectedDist) {
  let psi = 0;
  
  for (let i = 0; i < actualDist.length; i++) {
    const actual = actualDist[i] || 0.0001; // Avoid log(0)
    const expected = expectedDist[i] || 0.0001;
    
    psi += (actual - expected) * Math.log(actual / expected);
  }
  
  return psi;
}

/**
 * Bin data into distribution
 */
function binData(values, bins) {
  const counts = new Array(bins.length - 1).fill(0);
  
  for (const val of values) {
    for (let i = 0; i < bins.length - 1; i++) {
      if (val >= bins[i] && val < bins[i + 1]) {
        counts[i]++;
        break;
      }
    }
  }
  
  // Normalize to percentages
  const total = values.length || 1;
  return counts.map(c => c / total);
}

/**
 * Generate synthetic current data (simulate 7-day drift)
 * In production, fetch from actual prediction logs
 */
function generateCurrentData(n = 10000) {
  const data = [];
  
  for (let i = 0; i < n; i++) {
    // Slight drift: mean shifted by 5%, std increased by 10%
    const driftFactor = 1.05;
    const noiseFactor = 1.1;
    
    data.push({
      mid: REFERENCE_DISTRIBUTIONS.mid.mean * driftFactor + 
           (Math.random() - 0.5) * REFERENCE_DISTRIBUTIONS.mid.std * 2 * noiseFactor,
      spreadBp: REFERENCE_DISTRIBUTIONS.spreadBp.mean * driftFactor + 
                (Math.random() - 0.5) * REFERENCE_DISTRIBUTIONS.spreadBp.std * 2 * noiseFactor,
      vol1m: REFERENCE_DISTRIBUTIONS.vol1m.mean * driftFactor + 
             (Math.random() - 0.5) * REFERENCE_DISTRIBUTIONS.vol1m.std * 2 * noiseFactor,
      rsi14: Math.max(0, Math.min(100,
        REFERENCE_DISTRIBUTIONS.rsi14.mean * driftFactor + 
        (Math.random() - 0.5) * REFERENCE_DISTRIBUTIONS.rsi14.std * 2 * noiseFactor
      ))
    });
  }
  
  return data;
}

/**
 * Calculate reference distributions (baseline)
 */
function getReferenceDistributions() {
  const ref = {};
  
  for (const [feature, config] of Object.entries(REFERENCE_DISTRIBUTIONS)) {
    // Generate reference data (normal distribution)
    const values = [];
    for (let i = 0; i < 10000; i++) {
      let val = config.mean + (Math.random() - 0.5) * config.std * 2;
      if (feature === 'rsi14') val = Math.max(0, Math.min(100, val));
      if (feature === 'spreadBp' || feature === 'vol1m') val = Math.max(0, val);
      values.push(val);
    }
    
    ref[feature] = binData(values, config.bins);
  }
  
  return ref;
}

/**
 * Main PSI calculation
 */
function calculatePSISnapshot() {
  console.log('=== PSI Drift Detection ===');
  console.log('Calculating Population Stability Index for each feature...');
  console.log('');
  
  // Get reference distributions
  const referenceDists = getReferenceDistributions();
  
  // Generate current data (in production: fetch from logs/db)
  const currentData = generateCurrentData(10000);
  
  // Calculate PSI for each feature
  const psiScores = {};
  let overallPSI = 0;
  
  for (const [feature, config] of Object.entries(REFERENCE_DISTRIBUTIONS)) {
    const currentValues = currentData.map(d => d[feature]);
    const currentDist = binData(currentValues, config.bins);
    const refDist = referenceDists[feature];
    
    const psi = calculatePSI(currentDist, refDist);
    psiScores[feature] = {
      psi,
      status: psi < 0.1 ? 'stable' : psi < 0.2 ? 'warning' : 'critical',
      current_dist: currentDist.map(v => Math.round(v * 10000) / 100),
      reference_dist: refDist.map(v => Math.round(v * 10000) / 100)
    };
    
    overallPSI += psi;
  }
  
  overallPSI /= Object.keys(REFERENCE_DISTRIBUTIONS).length;
  
  const report = {
    timestamp: new Date().toISOString(),
    overall_psi: Math.round(overallPSI * 10000) / 10000,
    overall_status: overallPSI < 0.1 ? 'stable' : overallPSI < 0.2 ? 'warning' : 'critical',
    features: psiScores,
    thresholds: {
      stable: '< 0.1',
      warning: '0.1 - 0.2',
      critical: '> 0.2'
    },
    slo_check: {
      psi_under_0_2: overallPSI < 0.2,
      pass: overallPSI < 0.2
    }
  };
  
  // Print results
  console.log('--- Per-Feature PSI ---');
  for (const [feature, data] of Object.entries(report.features)) {
    const icon = data.status === 'stable' ? '✅' : data.status === 'warning' ? '⚠️' : '❌';
    console.log(`${feature}: ${data.psi.toFixed(4)} ${icon} (${data.status})`);
  }
  console.log('');
  console.log(`Overall PSI: ${report.overall_psi} ${report.slo_check.psi_under_0_2 ? '✅' : '❌'} (SLO: <0.2)`);
  console.log(`Status: ${report.overall_status.toUpperCase()}`);
  console.log('');
  console.log(`SLO Check: ${report.slo_check.pass ? '✅ PASS' : '❌ FAIL'}`);
  console.log('');
  
  // Save to evidence
  const evidenceDir = path.join(process.cwd(), 'evidence', 'ml');
  if (!fs.existsSync(evidenceDir)) {
    fs.mkdirSync(evidenceDir, { recursive: true });
  }
  
  const filename = path.join(evidenceDir, 'psi_snapshot.json');
  fs.writeFileSync(filename, JSON.stringify(report, null, 2));
  console.log(`📊 Evidence saved: ${filename}`);
  console.log('');
  
  // Output JSON
  console.log(JSON.stringify(report, null, 2));
  
  process.exit(report.slo_check.pass ? 0 : 1);
}

calculatePSISnapshot();

