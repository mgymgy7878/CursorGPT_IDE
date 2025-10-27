#!/usr/bin/env node

const http = require('http');

const baseUrl = 'http://localhost:4001/optimizer';

function fetchMetrics() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4001,
      path: '/optimizer/metrics',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve(data);
      });
    });

    req.on('error', reject);
    req.end();
  });
}

function parseMetrics(metricsText) {
  const lines = metricsText.split('\n');
  const metrics = {};
  
  for (const line of lines) {
    if (line.startsWith('#') || line.trim() === '') continue;
    
    const [name, value] = line.split(' ');
    if (name && value) {
      metrics[name] = parseFloat(value);
    }
  }
  
  return metrics;
}

function assertThreshold(actual, threshold, name, operator = '>') {
  const passed = operator === '>' ? actual <= threshold : actual >= threshold;
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} ${name}: ${actual} ${operator} ${threshold}`);
  return passed;
}

async function assertOptimizerMetrics() {
  console.log('Fetching optimizer metrics...');
  
  try {
    const metricsText = await fetchMetrics();
    const metrics = parseMetrics(metricsText);
    
    console.log('\n=== Optimizer Metrics Assertions ===');
    
    // Check queue depth
    const queueDepth = metrics['optimizer_queue_depth'] || 0;
    assertThreshold(queueDepth, 200, 'Queue Depth', '<=');
    
    // Check workers running
    const workersRunning = metrics['optimizer_workers_running'] || 0;
    assertThreshold(workersRunning, 2, 'Workers Running', '>=');
    
    // Check CPU usage
    const cpuUsage = metrics['optimizer_resource_cpu_pct'] || 0;
    assertThreshold(cpuUsage, 80, 'CPU Usage %', '<=');
    
    // Check memory usage
    const memUsage = metrics['optimizer_resource_mem_pct'] || 0;
    assertThreshold(memUsage, 80, 'Memory Usage %', '<=');
    
    // Check job success rate
    const jobsTotal = metrics['optimizer_jobs_total'] || 0;
    const jobsSucceeded = metrics['optimizer_jobs_total{status="succeeded"}'] || 0;
    const successRate = jobsTotal > 0 ? (jobsSucceeded / jobsTotal) * 100 : 100;
    assertThreshold(successRate, 95, 'Job Success Rate %', '>=');
    
    console.log('\n=== Summary ===');
    console.log(`Queue Depth: ${queueDepth}`);
    console.log(`Workers Running: ${workersRunning}`);
    console.log(`CPU Usage: ${cpuUsage}%`);
    console.log(`Memory Usage: ${memUsage}%`);
    console.log(`Job Success Rate: ${successRate.toFixed(2)}%`);
    
    // Overall health check
    const allPassed = queueDepth <= 200 && 
                     workersRunning >= 2 && 
                     cpuUsage <= 80 && 
                     memUsage <= 80 && 
                     successRate >= 95;
    
    if (allPassed) {
      console.log('\n🎉 All assertions passed! Optimizer is healthy.');
      process.exit(0);
    } else {
      console.log('\n❌ Some assertions failed. Optimizer needs attention.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('Error fetching metrics:', error);
    process.exit(1);
  }
}

assertOptimizerMetrics();
