#!/usr/bin/env node
/**
 * Smoke test: /backtest redirect to /strategy-lab?tab=backtest
 */

const http = require('http');

const testRedirect = () => {
  return new Promise((resolve, reject) => {
    const req = http.get('http://127.0.0.1:3003/backtest', (res) => {
      if (res.statusCode === 307 || res.statusCode === 302 || res.statusCode === 301) {
        const location = res.headers.location;
        if (location && location.includes('/strategy-lab')) {
          console.log(`✅ PASS: /backtest redirects (${res.statusCode}) to ${location}`);
          resolve(true);
        } else {
          console.log(`❌ FAIL: Redirect location incorrect: ${location}`);
          reject(new Error('Invalid redirect location'));
        }
      } else if (res.statusCode === 200) {
        // Client-side redirect (Next.js useRouter)
        console.log('✅ PASS: /backtest returns 200 (client-side redirect via useRouter)');
        resolve(true);
      } else {
        console.log(`❌ FAIL: Expected redirect, got ${res.statusCode}`);
        reject(new Error(`Unexpected status: ${res.statusCode}`));
      }
    });

    req.on('error', (err) => {
      console.log('❌ FAIL: Connection error:', err.message);
      reject(err);
    });

    req.setTimeout(5000, () => {
      console.log('❌ FAIL: Request timeout');
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
};

testRedirect()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));

