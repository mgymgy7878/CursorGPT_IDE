// ML Offline Evaluation Script (v1.8) - CJS Version
// Validates offline training report against SLO thresholds
const { readFileSync, writeFileSync } = require('node:fs');

try {
  // Read offline report
  const reportRaw = readFileSync('evidence/ml/offline_report.json', 'utf-8');
  const report = JSON.parse(reportRaw);
  
  // SLO thresholds
  const AUC_THRESHOLD = 0.62;
  const PRECISION_THRESHOLD = 0.58;
  
  // Evaluate
  const aucCheck = report.auc >= AUC_THRESHOLD;
  const precisionCheck = report.precision_at_20 >= PRECISION_THRESHOLD;
  const passed = aucCheck && precisionCheck;
  
  const result = {
    passed,
    auc_check: aucCheck,
    precision_check: precisionCheck,
    message: passed 
      ? 'All SLO thresholds met' 
      : 'Some SLO thresholds failed'
  };
  
  // Write result
  writeFileSync('evidence/ml/eval_result.txt', passed ? 'PASS' : 'FAIL');
  writeFileSync('evidence/ml/eval_result.json', JSON.stringify(result, null, 2));
  
  console.log('=== ML Offline Evaluation ===');
  console.log(`Model Version: ${report.version}`);
  console.log(`AUC: ${report.auc} >= ${AUC_THRESHOLD} ${aucCheck ? '✅' : '❌'}`);
  console.log(`Precision@20: ${report.precision_at_20} >= ${PRECISION_THRESHOLD} ${precisionCheck ? '✅' : '❌'}`);
  console.log('');
  console.log(`Result: ${passed ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Output: evidence/ml/eval_result.txt`);
  console.log('');
  
  process.exit(passed ? 0 : 1);
  
} catch (error) {
  console.error('❌ Evaluation failed:', error.message);
  writeFileSync('evidence/ml/eval_result.txt', 'ERROR');
  process.exit(1);
}

