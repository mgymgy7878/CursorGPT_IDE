// Backtest Run Script (v1.6-p4)
const http = require('http');

const scenarios = [
  {
    strategy: 'momentum',
    dataset: 'small-eth',
    timeframe: '1h',
    startDate: '2024-01-01',
    endDate: '2024-01-31',
    initialCapital: 10000,
    seed: 42,
    variants: 2
  },
  {
    strategy: 'mean-reversion',
    dataset: 'small-btc',
    timeframe: '1h',
    startDate: '2024-02-01',
    endDate: '2024-02-28',
    initialCapital: 10000,
    seed: 42,
    variants: 2
  },
  {
    strategy: 'arbitrage',
    dataset: 'small-bist',
    timeframe: '1m',
    startDate: '2024-03-01',
    endDate: '2024-03-07',
    initialCapital: 10000,
    seed: 42,
    variants: 2
  }
];

async function runBacktestScenarios() {
  console.log('Running deterministic backtest scenarios...');
  
  for (const scenario of scenarios) {
    console.log(`\nRunning ${scenario.strategy} on ${scenario.dataset} (seed: ${scenario.seed})`);
    
    for (let variant = 1; variant <= scenario.variants; variant++) {
      try {
        const config = {
          strategy: scenario.strategy,
          dataset: scenario.dataset,
          timeframe: scenario.timeframe,
          startDate: scenario.startDate,
          endDate: scenario.endDate,
          initialCapital: scenario.initialCapital,
          seed: scenario.seed
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
        console.log(`  Variant ${variant}:`, {
          success: result.success,
          totalReturn: result.result?.totalReturn,
          sharpeRatio: result.result?.sharpeRatio,
          runtime: result.result?.runtime
        });
        
      } catch (error) {
        console.error(`  Variant ${variant} failed:`, error.message);
      }
    }
  }
  
  console.log('\nBacktest scenarios completed');
}

runBacktestScenarios();
