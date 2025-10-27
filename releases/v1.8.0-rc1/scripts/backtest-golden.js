// Backtest Golden Script (v1.6-p4)
const http = require('http');
const fs = require('fs');
const path = require('path');

async function runGoldenTest(dataset, seed, goldenFile) {
  console.log(`Running golden test for ${dataset} (seed: ${seed})`);
  
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
      // Create golden file if it doesn't exist
      const goldenPath = path.join(__dirname, '..', goldenFile);
      const goldenDir = path.dirname(goldenPath);
      
      if (!fs.existsSync(goldenDir)) {
        fs.mkdirSync(goldenDir, { recursive: true });
      }
      
      if (!fs.existsSync(goldenPath)) {
        fs.writeFileSync(goldenPath, JSON.stringify(result.result, null, 2));
        console.log(`✅ Golden file created: ${goldenFile}`);
      } else {
        // Compare with existing golden file
        const goldenContent = JSON.parse(fs.readFileSync(goldenPath, 'utf8'));
        const diff = JSON.stringify(result.result) === JSON.stringify(goldenContent);
        
        if (diff) {
          console.log(`✅ Golden diff = 0 (deterministic)`);
        } else {
          console.log(`❌ Golden diff > 0 (non-deterministic)`);
          console.log('Expected:', goldenContent);
          console.log('Actual:', result.result);
        }
      }
    } else {
      console.log(`❌ Backtest failed: ${result.error}`);
    }
    
  } catch (error) {
    console.error(`❌ Golden test failed: ${error.message}`);
  }
}

// Run golden tests
async function runGoldenTests() {
  console.log('Running golden file tests...');
  
  await runGoldenTest('small-eth', 42, 'golden/small-eth-42.json');
  await runGoldenTest('small-btc', 42, 'golden/small-btc-42.json');
  await runGoldenTest('small-bist', 42, 'golden/small-bist-42.json');
  
  console.log('\nGolden tests completed');
}

runGoldenTests();
