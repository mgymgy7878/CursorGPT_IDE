#!/usr/bin/env node

const http = require('http');

const args = process.argv.slice(2);
const parallel = parseInt(args.find(arg => arg.startsWith('--parallel='))?.split('=')[1] || '6');
const variants = parseInt(args.find(arg => arg.startsWith('--variants='))?.split('=')[1] || '8');
const kind = args.find(arg => arg.startsWith('--kind='))?.split('=')[1] || 'optimize';

console.log(`Seeding ${parallel} parallel jobs with ${variants} variants each (${parallel * variants} total jobs)`);

const baseUrl = 'http://localhost:4001/optimizer';

function createJob(variant) {
  return new Promise((resolve, reject) => {
    const payload = {
      kind,
      priority: variant % 3 === 0 ? 'high' : variant % 3 === 1 ? 'normal' : 'low',
      source: 'api',
      payload: {
        strategyId: `test-${variant}`,
        type: 'momentum',
        params: {
          lookback: 10 + variant,
          threshold: 0.01 + (variant * 0.001)
        }
      },
      deadline: Date.now() + 300000, // 5 minutes
      maxRetries: 3
    };

    const postData = JSON.stringify(payload);
    const options = {
      hostname: 'localhost',
      port: 4001,
      path: '/optimizer/enqueue',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve({ variant, success: result.success, jobId: result.jobId });
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function seedJobs() {
  const jobs = [];
  
  for (let p = 0; p < parallel; p++) {
    const batch = [];
    for (let v = 0; v < variants; v++) {
      const variant = p * variants + v;
      batch.push(createJob(variant));
    }
    jobs.push(...batch);
  }

  console.log(`Starting ${jobs.length} jobs...`);
  const startTime = Date.now();
  
  try {
    const results = await Promise.all(jobs);
    const duration = Date.now() - startTime;
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`Completed in ${duration}ms`);
    console.log(`Successful: ${successful}, Failed: ${failed}`);
    console.log(`Rate: ${(successful / (duration / 1000)).toFixed(2)} jobs/sec`);
    
    if (failed > 0) {
      console.log('Failed jobs:', results.filter(r => !r.success));
    }
    
  } catch (error) {
    console.error('Error seeding jobs:', error);
    process.exit(1);
  }
}

seedJobs();
