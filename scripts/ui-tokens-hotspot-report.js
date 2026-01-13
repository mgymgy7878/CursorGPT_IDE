#!/usr/bin/env node
/**
 * UI Tokens Hotspot Report
 *
 * Baseline violation'larını analiz eder ve en çok ihlal üreten dosyaları listeler.
 * Temizlik önceliği belirlemek için kullanılır.
 */

const fs = require('fs');
const path = require('path');

const BASELINE_FILE = path.join(__dirname, 'ui-tokens.baseline.json');

function loadBaseline() {
  if (!fs.existsSync(BASELINE_FILE)) {
    console.error('❌ Baseline file not found!');
    console.error('💡 Run: pnpm check:ui-tokens:baseline');
    process.exit(1);
  }

  try {
    const content = fs.readFileSync(BASELINE_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error(`❌ Failed to load baseline: ${err.message}`);
    process.exit(1);
  }
}

function generateHotspotReport(baseline) {
  const violations = baseline.violations || [];

  // Dosya bazında grupla
  const fileGroups = {};
  violations.forEach(v => {
    const file = v.file;
    if (!fileGroups[file]) {
      fileGroups[file] = {
        file,
        count: 0,
        patterns: new Set(),
        violations: [],
      };
    }
    fileGroups[file].count++;
    fileGroups[file].patterns.add(v.pattern);
    fileGroups[file].violations.push(v);
  });

  // Count'a göre sırala (en çok ihlal üretenler üstte)
  const sortedFiles = Object.values(fileGroups).sort((a, b) => b.count - a.count);

  console.log('📊 UI Tokens Hotspot Report\n');
  console.log(`Total violations: ${violations.length}`);
  console.log(`Total files: ${sortedFiles.length}\n`);

  console.log('🔥 Top 10 Hotspot Files (highest violation count):\n');

  sortedFiles.slice(0, 10).forEach((group, index) => {
    const relativePath = group.file.replace(/\\/g, '/').replace(/^.*apps\/web-next\/src\//, '');
    console.log(`${index + 1}. ${relativePath}`);
    console.log(`   Violations: ${group.count}`);
    console.log(`   Patterns: ${Array.from(group.patterns).map(p => p.replace(/[\/\\]/g, '')).join(', ')}`);
    console.log('');
  });

  // Pattern bazında analiz
  const patternGroups = {};
  violations.forEach(v => {
    const pattern = v.pattern.replace(/[\/\\]/g, '');
    if (!patternGroups[pattern]) {
      patternGroups[pattern] = 0;
    }
    patternGroups[pattern]++;
  });

  console.log('📈 Pattern Distribution:\n');
  const sortedPatterns = Object.entries(patternGroups)
    .sort((a, b) => b[1] - a[1]);

  sortedPatterns.forEach(([pattern, count]) => {
    const percentage = ((count / violations.length) * 100).toFixed(1);
    console.log(`  ${pattern.padEnd(30)} ${count.toString().padStart(4)} (${percentage}%)`);
  });

  console.log('\n💡 Cleanup Strategy:');
  console.log('   1. Start with top hotspot files (highest ROI)');
  console.log('   2. Replace hardcode classes with theme tokens');
  console.log('   3. Run: pnpm check:ui-tokens:baseline (to update baseline)');
  console.log('   4. Repeat until baseline is clean');

  // JSON output (opsiyonel, script'ler için)
  if (process.argv.includes('--json')) {
    const report = {
      totalViolations: violations.length,
      totalFiles: sortedFiles.length,
      topHotspots: sortedFiles.slice(0, 10).map(g => ({
        file: g.file.replace(/\\/g, '/').replace(/^.*apps\/web-next\/src\//, ''),
        count: g.count,
        patterns: Array.from(g.patterns),
      })),
      patternDistribution: patternGroups,
    };
    console.log('\n📄 JSON Output:');
    console.log(JSON.stringify(report, null, 2));
  }
}

function main() {
  const baseline = loadBaseline();
  generateHotspotReport(baseline);
}

main();
