// Assert Drift Gates Script (v1.6-p3)
const http = require('http');

async function assertDriftGates() {
  console.log('Asserting drift gates metrics...');
  
  try {
    const response = await new Promise((resolve, reject) => {
      const req = http.request({
        hostname: '127.0.0.1',
        port: 4001,
        path: '/gates/metrics',
        method: 'GET'
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ statusCode: res.statusCode, data }));
      });
      req.on('error', reject);
      req.end();
    });
    
    if (response.statusCode !== 200) {
      throw new Error(`HTTP ${response.statusCode}`);
    }
    
    const metrics = response.data;
    
    // Check required metrics
    const requiredMetrics = [
      'gate_state',
      'gate_close_total',
      'paper_trade_share_pct',
      'paper_live_delta_pnl_bucket',
      'drift_slippage_bp_bucket',
      'gate_decision_latency_ms_bucket'
    ];
    
    const foundMetrics = requiredMetrics.filter(metric => 
      metrics.includes(metric)
    );
    
    console.log(`Found ${foundMetrics.length}/${requiredMetrics.length} required metrics`);
    
    // Check gate state
    const gateStateMatch = metrics.match(/gate_state\{gate="paper_drift",reason="initialized"\} (\d+)/);
    const gateState = gateStateMatch ? parseInt(gateStateMatch[1]) : null;
    
    // Check paper share
    const paperShareMatch = metrics.match(/paper_trade_share_pct (\d+\.?\d*)/);
    const paperShare = paperShareMatch ? parseFloat(paperShareMatch[1]) : null;
    
    console.log('=== Drift Gates Assertions ===');
    console.log(`✅ Gate State: ${gateState} (0=open)`);
    console.log(`✅ Paper Share: ${paperShare}%`);
    console.log(`✅ Metrics Found: ${foundMetrics.length}/${requiredMetrics.length}`);
    
    // Assertions
    const assertions = [
      { name: 'Gate State', value: gateState, expected: 0, operator: '==' },
      { name: 'Paper Share', value: paperShare, expected: 45.2, operator: '==' },
      { name: 'Metrics Coverage', value: foundMetrics.length, expected: requiredMetrics.length, operator: '>=' }
    ];
    
    let passed = 0;
    for (const assertion of assertions) {
      const result = eval(`${assertion.value} ${assertion.operator} ${assertion.expected}`);
      console.log(`${result ? '✅' : '❌'} ${assertion.name}: ${assertion.value} ${assertion.operator} ${assertion.expected}`);
      if (result) passed++;
    }
    
    console.log(`\n🎉 ${passed}/${assertions.length} assertions passed!`);
    
    if (passed === assertions.length) {
      console.log('✅ All drift gates assertions passed!');
    } else {
      console.log('❌ Some assertions failed');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('Assertion failed:', error.message);
    process.exit(1);
  }
}

assertDriftGates();
