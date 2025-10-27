// Export Seed Script (v1.7)
const http = require('http');

async function seedExport(records, format) {
  console.log(`Seeding ${records} records in ${format} format...`);
  
  // Generate test data
  const data = [];
  for (let i = 0; i < records; i++) {
    data.push({
      id: i + 1,
      timestamp: new Date().toISOString(),
      value: Math.random() * 1000,
      category: `category_${i % 10}`,
      status: i % 2 === 0 ? 'active' : 'inactive'
    });
  }
  
  const config = {
    format: format,
    data: data,
    columns: ['id', 'timestamp', 'value', 'category', 'status'],
    title: `Export Report - ${records} records`,
    user: 'test-user'
  };
  
  try {
    const postData = JSON.stringify(config);
    const options = {
      hostname: '127.0.0.1',
      port: 4001,
      path: '/export/run',
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
      console.log(`✅ Export successful:`, {
        format: format,
        records: records,
        bytes: result.result.bytes,
        processingTime: result.processingTime
      });
    } else {
      console.log(`❌ Export failed: ${result.error}`);
    }
    
  } catch (error) {
    console.error(`❌ Export error: ${error.message}`);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const records = parseInt(args.find(arg => arg.startsWith('--records='))?.split('=')[1]) || 1000;
const format = args.find(arg => arg.startsWith('--format='))?.split('=')[1] || 'csv';
const batch = args.includes('--batch');

// Batch mode: test multiple scenarios
async function runBatchTests() {
  console.log('Running batch export tests...\n');
  
  const scenarios = [
    { records: 1000, format: 'csv' },
    { records: 5000, format: 'csv' },
    { records: 10000, format: 'csv' },
    { records: 1000, format: 'pdf' },
    { records: 5000, format: 'pdf' },
  ];
  
  for (const scenario of scenarios) {
    await seedExport(scenario.records, scenario.format);
    // Wait 1s between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n✅ All batch tests completed');
}

// Run single or batch
if (batch) {
  runBatchTests();
} else {
  seedExport(records, format);
}

// Summary: Export seed script with single (--records=N --format=csv|pdf) and batch mode (--batch)
