// Seed Drift Gates Script (v1.6-p3)
const http = require('http');

const scenarios = {
  pnl: { pnlDelta: -0.015, slippageBp: 8, paperShare: 0.45 },
  slippage: { pnlDelta: 0.005, slippageBp: 18, paperShare: 0.35 },
  share: { pnlDelta: 0.003, slippageBp: 12, paperShare: 0.85 }
};

async function seedDriftScenarios() {
  console.log('Seeding drift scenarios...');
  
  for (const [scenario, data] of Object.entries(scenarios)) {
    try {
      const postData = JSON.stringify(data);
      const options = {
        hostname: '127.0.0.1',
        port: 4001,
        path: '/gates/detect-drift',
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
      console.log(`Scenario ${scenario}:`, {
        driftDetected: result.driftDetected,
        reasons: result.reasons,
        recommendation: result.recommendations?.gateAction
      });
      
    } catch (error) {
      console.error(`Scenario ${scenario} failed:`, error.message);
    }
  }
  
  console.log('Drift seeding completed');
}

seedDriftScenarios();
