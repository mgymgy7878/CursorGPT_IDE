// Validate Golden Files Script (v1.6-p4)
const fs = require('fs');
const path = require('path');

const goldenFiles = [
  'golden/momentum-btc-1h.json',
  'golden/mean-reversion-eth-1h.json',
  'golden/arbitrage-btc-1m.json'
];

function validateGoldenFiles() {
  console.log('Validating golden files...');
  
  let validFiles = 0;
  
  for (const file of goldenFiles) {
    const filePath = path.join(__dirname, '..', file);
    
    if (fs.existsSync(filePath)) {
      try {
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        // Validate golden file structure
        const requiredFields = ['strategy', 'dataset', 'totalReturn', 'sharpeRatio', 'maxDrawdown', 'totalTrades', 'winRate'];
        const hasRequiredFields = requiredFields.every(field => content.hasOwnProperty(field));
        
        if (hasRequiredFields) {
          console.log(`✅ ${file}: Valid structure`);
          validFiles++;
        } else {
          console.log(`❌ ${file}: Missing required fields`);
        }
        
      } catch (error) {
        console.log(`❌ ${file}: Invalid JSON - ${error.message}`);
      }
    } else {
      console.log(`❌ ${file}: File not found`);
    }
  }
  
  console.log(`\n🎉 ${validFiles}/${goldenFiles.length} golden files valid!`);
  
  if (validFiles === goldenFiles.length) {
    console.log('✅ All golden files validation passed!');
  } else {
    console.log('❌ Some golden files validation failed');
    process.exit(1);
  }
}

validateGoldenFiles();
