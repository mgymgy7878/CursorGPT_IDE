// Run Backtest Scenarios Script (v1.6-p4)
const http = require('http');

const scenarios = [
  {
    strategy: 'momentum',
    dataset: 'btc-1h',
    timeframe: '1h',
    startDate: '2024-01-01',
    endDate: '2024-01-31',
    initialCapital: 10000,
    seed: 12345
  },
  {
    strategy: 'mean-reversion',
    dataset: 'eth-1h',
    timeframe: '1h',
    startDate: '2024-02-01',
    endDate: '2024-02-28',
    initialCapital: 10000,
    seed: 12345
  },
  {
    strategy: 'arbitrage',
    dataset: 'btc-1m',
    timeframe: '1m',
    startDate: '2024-03-01',
    endDate: '2024-03-07',
    initialCapital: 10000,
    seed: 12345
  }
];

async function runBacktestScenarios() {
  console.log('Running deterministic backtest scenarios...');
  
  for (const scenario of scenarios) {
    try {
      const postData = JSON.stringify(scenario);
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
      console.log(`Scenario ${scenario.strategy}:`, {
        success: result.success,
        totalReturn: result.result?.totalReturn,
        sharpeRatio: result.result?.sharpeRatio,
        runtime: result.result?.runtime
      });
      
    } catch (error) {
      console.error(`Scenario ${scenario.strategy} failed:`, error.message);
    }
  }
  
  console.log('Backtest scenarios completed');
}

runBacktestScenarios();
