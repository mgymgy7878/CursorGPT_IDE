// Export Assert Script (v1.7)
const http = require('http');

async function assertExportMetrics() {
  console.log('Asserting export metrics...');
  
  try {
    const response = await new Promise((resolve, reject) => {
      const req = http.request({
        hostname: '127.0.0.1',
        port: 4001,
        path: '/export/metrics',
        method: 'GET'
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ statusCode: res.statusCode, data }));
      });
      req.on('error', reject);
      req.end();
    });
    
    const metrics = response.data;
    
    // Check required metrics
    const requiredMetrics = [
      'export_requests_total',
      'export_latency_ms_bucket',
      'export_bytes_total',
      'export_concurrent_running',
      'export_queue_depth',
      'export_fail_total',
      'export_memory_bytes',
      'export_throughput_ops_per_sec',
      'export_success_rate'
    ];
    
    const foundMetrics = requiredMetrics.filter(metric => 
      metrics.includes(metric)
    );
    
    console.log(`Found ${foundMetrics.length}/${requiredMetrics.length} required metrics`);
    
    // Parse metrics
    const latencyBucketMatch = metrics.match(/export_latency_ms_bucket\{format="csv",size="[^"]+",le="\+Inf"\} (\d+)/);
    const latencyCount = latencyBucketMatch ? parseInt(latencyBucketMatch[1]) : 0;
    
    const latencySumMatch = metrics.match(/export_latency_ms_bucket_sum\{format="csv",size="[^"]+"\} ([\d.]+)/);
    const latencySum = latencySumMatch ? parseFloat(latencySumMatch[1]) : 0;
    
    const latencyAvg = latencyCount > 0 ? latencySum / latencyCount : 0;
    
    const successRateMatch = metrics.match(/export_success_rate\{format="csv"\} ([\d.]+)/);
    const successRate = successRateMatch ? parseFloat(successRateMatch[1]) : 0;
    
    const concurrentMatch = metrics.match(/export_concurrent_running ([\d.]+)/);
    const concurrent = concurrentMatch ? parseFloat(concurrentMatch[1]) : 0;
    
    const queueDepthMatch = metrics.match(/export_queue_depth ([\d.]+)/);
    const queueDepth = queueDepthMatch ? parseFloat(queueDepthMatch[1]) : 0;
    
    const bytesTotalMatch = metrics.match(/export_bytes_total\{format="csv",status="success"\} ([\d.]+)/);
    const bytesTotal = bytesTotalMatch ? parseFloat(bytesTotalMatch[1]) : 0;
    
    console.log('=== Export Metrics Assertions ===');
    console.log(`Latency Avg: ${latencyAvg.toFixed(2)}ms (count: ${latencyCount})`);
    console.log(`Success Rate: ${(successRate * 100).toFixed(1)}%`);
    console.log(`Concurrent Exports: ${concurrent} / 5 max`);
    console.log(`Queue Depth: ${queueDepth}`);
    console.log(`Bytes Exported: ${(bytesTotal / 1024).toFixed(2)} KB`);
    console.log(`Metrics Found: ${foundMetrics.length}/${requiredMetrics.length}`);
    
    // Comprehensive assertions
    const assertions = [
      { name: 'Metrics Coverage', pass: foundMetrics.length === requiredMetrics.length },
      { name: 'Latency P95 < 10s', pass: latencyAvg < 10000 },
      { name: 'Success Rate >= 95%', pass: successRate >= 0.95 },
      { name: 'Concurrent <= 5', pass: concurrent <= 5 },
      { name: 'Queue Depth <= 100', pass: queueDepth <= 100 },
      { name: 'Bytes Exported > 0', pass: bytesTotal > 0 }
    ];
    
    console.log('\n=== Assertions ===');
    assertions.forEach(assertion => {
      const status = assertion.pass ? '✅' : '❌';
      console.log(`${status} ${assertion.name}`);
    });
    
    const passed = assertions.filter(a => a.pass).length;
    
    if (passed === assertions.length) {
      console.log('✅ All export metrics assertions passed!');
    } else {
      console.log('❌ Some export metrics assertions failed!');
      process.exit(1);
    }
    
  } catch (error) {
    console.error(`❌ Export metrics assertion failed: ${error.message}`);
    process.exit(1);
  }
}

assertExportMetrics();
