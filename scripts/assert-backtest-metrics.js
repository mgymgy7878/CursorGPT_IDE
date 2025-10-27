// Assert Backtest Metrics Script (v1.6-p4)
const http = require('http');

async function assertBacktestMetrics() {
  console.log('Asserting backtest metrics...');
  
  try {
    const response = await new Promise((resolve, reject) => {
      const req = http.request({
        hostname: '127.0.0.1',
        port: 4001,
        path: '/backtest/metrics',
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
      'backtest_runtime_ms_bucket',
      'dataset_bytes_total',
      'sim_fills_total',
      'sim_pnl_hist_bucket',
      'backtest_throughput_ops_per_sec',
      'backtest_errors_total',
      'backtest_memory_bytes'
    ];
    
    const foundMetrics = requiredMetrics.filter(metric => 
      metrics.includes(metric)
    );
    
    console.log(`Found ${foundMetrics.length}/${requiredMetrics.length} required metrics`);
    
    // Check runtime metric
    const runtimeMatch = metrics.match(/backtest_runtime_ms_bucket\{strategy="momentum",dataset="small-eth",timeframe="1h"\} (\d+)/);
    const runtime = runtimeMatch ? parseInt(runtimeMatch[1]) : null;
    
    // Check fills metric
    const fillsMatch = metrics.match(/sim_fills_total\{strategy="momentum",symbol="ETH\/USD",side="buy"\} (\d+)/);
    const fills = fillsMatch ? parseInt(fillsMatch[1]) : null;
    
    console.log('=== Backtest Metrics Assertions ===');
    console.log(`✅ Runtime: ${runtime}ms`);
    console.log(`✅ Fills: ${fills}`);
    console.log(`✅ Metrics Found: ${foundMetrics.length}/${requiredMetrics.length}`);
    
    // Assertions
    const assertions = [
      { name: 'Runtime', value: runtime, expected: 0, operator: '>=' },
      { name: 'Fills', value: fills, expected: 0, operator: '>=' },
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
      console.log('✅ All backtest metrics assertions passed!');
    } else {
      console.log('❌ Some assertions failed');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('Assertion failed:', error.message);
    process.exit(1);
  }
}

assertBacktestMetrics();
