// Backtest Soak Test (v1.6-p4 Day-1)
const http = require('http');

async function runSoakTest(dataset, seed, goldenFile, repeat = 3, interval = 600) {
  console.log(`Running soak test for ${dataset} (seed: ${seed}, repeat: ${repeat}, interval: ${interval}s)`);
  
  for (let i = 1; i <= repeat; i++) {
    console.log(`\n--- Soak Run ${i}/${repeat} ---`);
    
    try {
      const config = {
        strategy: 'momentum',
        dataset: dataset,
        timeframe: '1h',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        initialCapital: 10000,
        seed: seed
      };
      
      const postData = JSON.stringify(config);
      const options = {
        hostname: '127.0.0.1',
        port: 4001,
        path: '/backtest/run',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };
      
      const response = await new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => resolve({ statusCode: res.statusCode, data }));
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
      });
      
      const result = JSON.parse(response.data);
      
      if (result.success) {
        console.log(`✅ Run ${i}:`, {
          totalReturn: result.result.totalReturn,
          sharpeRatio: result.result.sharpeRatio,
          runtime: result.result.runtime,
          timestamp: result.timestamp
        });
        
        // Check golden file consistency
        const fs = require('fs');
        const path = require('path');
        const goldenPath = path.join(__dirname, '..', goldenFile);
        
        if (fs.existsSync(goldenPath)) {
          const goldenContent = JSON.parse(fs.readFileSync(goldenPath, 'utf8'));
          const isConsistent = JSON.stringify(result.result) === JSON.stringify(goldenContent);
          
          if (isConsistent) {
            console.log(`✅ Golden diff = 0 (deterministic)`);
          } else {
            console.log(`❌ Golden diff > 0 (non-deterministic)`);
            console.log('Expected:', goldenContent);
            console.log('Actual:', result.result);
          }
        }
        
      } else {
        console.log(`❌ Run ${i} failed: ${result.error}`);
      }
      
      // Wait between runs
      if (i < repeat) {
        console.log(`Waiting ${interval}s before next run...`);
        await new Promise(resolve => setTimeout(resolve, interval * 1000));
      }
      
    } catch (error) {
      console.error(`❌ Soak run ${i} failed: ${error.message}`);
    }
  }
  
  console.log(`\nSoak test completed for ${dataset}`);
}

// Run soak tests for all datasets
async function runSoakTests() {
  console.log('Starting Day-1 soak tests...');
  
  const datasets = [
    { name: 'small-eth', seed: 42, golden: 'golden/small-eth-42.json' },
    { name: 'small-btc', seed: 42, golden: 'golden/small-btc-42.json' },
    { name: 'small-bist', seed: 42, golden: 'golden/small-bist-42.json' }
  ];
  
  for (const dataset of datasets) {
    await runSoakTest(dataset.name, dataset.seed, dataset.golden, 3, 10); // 3 runs, 10s interval
  }
  
  console.log('\nAll soak tests completed');
}

runSoakTests();
