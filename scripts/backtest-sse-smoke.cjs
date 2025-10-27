#!/usr/bin/env node
/**
 * Backtest SSE Stream Smoke Test
 * Tests GET /api/backtest/stream endpoint (Server-Sent Events)
 * Saves first snapshot to evidence
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const EXECUTOR_URL = process.env.EXECUTOR_URL || 'http://127.0.0.1:4001';
const EVIDENCE_DIR = path.join(__dirname, '..', 'evidence', 'observability');
const TIMEOUT_MS = 10000;

async function sseSmoke() {
  console.log('🧪 Backtest SSE Stream Smoke Test');
  console.log(`Target: ${EXECUTOR_URL}/api/backtest/stream\n`);

  const results = {
    timestamp: new Date().toISOString(),
    url: `${EXECUTOR_URL}/api/backtest/stream`,
    success: false,
    events: [],
    error: null,
  };

  return new Promise((resolve, reject) => {
    const urlObj = new URL(`${EXECUTOR_URL}/api/backtest/stream`);
    
    const req = http.get({
      hostname: urlObj.hostname,
      port: urlObj.port || 80,
      path: urlObj.pathname,
      headers: {
        'Accept': 'text/event-stream',
      },
    }, (res) => {
      if (res.statusCode !== 200) {
        results.error = `HTTP ${res.statusCode}`;
        console.error(`❌ Failed: HTTP ${res.statusCode}`);
        resolve(1);
        return;
      }

      console.log('✅ SSE connected');
      let buffer = '';
      let eventCount = 0;
      let snapshotReceived = false;

      const timeout = setTimeout(() => {
        req.destroy();
        if (!snapshotReceived) {
          results.error = 'Timeout waiting for snapshot';
          console.error('❌ Timeout: No snapshot received');
          resolve(1);
        }
      }, TIMEOUT_MS);

      res.on('data', (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const block of lines) {
          if (!block.trim()) continue;
          if (block.startsWith(':')) {
            // Heartbeat
            console.log('  ❤️  Heartbeat');
            continue;
          }

          const eventMatch = block.match(/event:\s*(\w+)\n?data:\s*(.+)/s);
          if (eventMatch) {
            const [, event, data] = eventMatch;
            console.log(`  📨 Event: ${event}`);
            
            eventCount++;
            results.events.push({ event, timestamp: new Date().toISOString() });

            if (event === 'snapshot') {
              snapshotReceived = true;
              try {
                const parsed = JSON.parse(data);
                console.log(`     Runs: ${parsed.runs?.length ?? 0}`);
                console.log(`     Stats: total=${parsed.stats?.total}, running=${parsed.stats?.running}`);
                results.snapshot = parsed;
              } catch (err) {
                console.warn('     ⚠️  Failed to parse snapshot data');
              }
            }

            // Exit after receiving snapshot + 1 more event (or heartbeat)
            if (snapshotReceived && eventCount >= 1) {
              clearTimeout(timeout);
              req.destroy();
              results.success = true;
              
              // Save evidence
              try {
                fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, -5);
                const evidenceFile = path.join(EVIDENCE_DIR, `sse_proof_${timestamp}.txt`);
                const proof = [
                  `Backtest SSE Smoke Test`,
                  `Timestamp: ${results.timestamp}`,
                  `URL: ${results.url}`,
                  `Success: ${results.success}`,
                  `Events Received: ${eventCount}`,
                  `\nSnapshot:`,
                  JSON.stringify(results.snapshot, null, 2),
                ].join('\n');
                fs.writeFileSync(evidenceFile, proof);
                console.log(`\n💾 Evidence saved: ${path.relative(process.cwd(), evidenceFile)}`);
              } catch (err) {
                console.warn('⚠️  Failed to save evidence:', err.message);
              }

              console.log('\n✅ SSE Smoke Test PASSED');
              resolve(0);
            }
          }
        }
      });

      res.on('end', () => {
        clearTimeout(timeout);
        if (!snapshotReceived) {
          results.error = 'Connection closed before snapshot';
          console.error('❌ Connection closed prematurely');
          resolve(1);
        }
      });

      res.on('error', (err) => {
        clearTimeout(timeout);
        results.error = err.message;
        console.error('❌ SSE Error:', err.message);
        resolve(1);
      });
    });

    req.on('error', (err) => {
      results.error = err.message;
      console.error('❌ HTTP Request Error:', err.message);
      console.error('   Make sure executor is running: pnpm --filter @spark/executor dev');
      resolve(1);
    });
  });
}

sseSmoke().then(code => process.exit(code));

