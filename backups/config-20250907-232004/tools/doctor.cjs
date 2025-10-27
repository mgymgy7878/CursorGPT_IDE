const fs = require('fs');
const http = require('http');
const path = require('path');

const T = (url, t = 4000) => new Promise((resolve) => {
  const req = http.get(url, (res) => {
    resolve({ url, ok: res.statusCode === 200, code: res.statusCode });
  });
  req.on('error', () => resolve({ url, ok: false, code: 'ERR' }));
  req.setTimeout(t, () => {
    req.destroy();
    resolve({ url, ok: false, code: 'TIMEOUT' });
  });
});

const main = async () => {
  // Check both services
  const api = await T('http://127.0.0.1:4001/health');
  const ui = await T('http://127.0.0.1:3003/api/public/ping');
  
  // Get environment info
  const out = {
    when: new Date().toISOString(),
    api,
    ui,
    env: {
      NODE: process.version,
      PNPM: process.env.npm_config_user_agent || 'unknown'
    }
  };
  
  // Ensure evidence directory exists
  const evidencePath = path.join(process.cwd(), 'evidence', 'analysis');
  fs.mkdirSync(evidencePath, { recursive: true });
  
  // Write report
  const reportPath = path.join(evidencePath, 'doctor.json');
  fs.writeFileSync(reportPath, JSON.stringify(out, null, 2));
  
  // Console output
  const status = (api.ok && ui.ok) ? 'GREEN' : 'RED';
  console.log(`\n==== DOCTOR REPORT (${status}) ====`);
  console.log(`Timestamp: ${out.when}`);
  console.log(`Node Version: ${out.env.NODE}`);
  console.log(`PNPM Version: ${out.env.PNPM}`);
  console.log(`\nServices:`);
  console.log(`  API (4001): ${api.ok ? '✅ OK' : `❌ ${api.code}`}`);
  console.log(`  UI  (3003): ${ui.ok ? '✅ OK' : `❌ ${ui.code}`}`);
  console.log(`\nReport saved to: ${reportPath}`);
  console.log('========================\n');
  
  // Exit with proper code
  process.exit((api.ok && ui.ok) ? 0 : 1);
};

main().catch((err) => {
  console.error('Doctor check failed:', err);
  process.exit(1);
});
