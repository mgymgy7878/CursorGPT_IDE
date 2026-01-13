#!/usr/bin/env node
/**
 * UI Token Lockdown Guard (Baseline Mode)
 *
 * Hardcode renk sınıflarını yakalar ve PR'da patlatır.
 * Baseline modu: Mevcut violation'ları baseline'a kaydeder, sadece yeni ihlalleri yakalar.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const FORBIDDEN_PATTERNS = [
  // Hardcode renkler
  /\bbg-white\b/,
  /\btext-black\b/,
  /\bborder-gray-\d+\b/,
  /\bbg-gray-\d+\b/,
  /\btext-gray-\d+\b/,

  // Dark mode hardcode'ları (token kullanılmalı)
  /\bdark:bg-\w+-\d+\b/,
  /\bdark:text-\w+-\d+\b/,
  /\bdark:border-\w+-\d+\b/,
];

const ALLOWED_PATTERNS = [
  // Tailwind utility sınıfları (bunlar token değil ama kabul edilebilir)
  /\bopacity-\d+\b/,
  /\bbackdrop-blur\b/,
  /\bshadow-\w+\b/,

  // CSS variable referansları (bunlar token kullanımı)
  /hsl\(var\(--\w+\)\)/,
  /var\(--\w+\)/,

  // Token sınıfları (bunlar izinli)
  /\bbg-card\b/,
  /\bbg-background\b/,
  /\bbg-surface\b/,
  /\btext-card-foreground\b/,
  /\btext-foreground\b/,
  /\bborder-border\b/,
  /\bborder-neutral-\d+\b/, // Neutral token'lar izinli
  /\bbg-neutral-\d+\b/,
  /\btext-neutral-\d+\b/,

  // White/black opacity kullanımları (kabul edilebilir)
  /\bbg-white\/\d+\b/, // bg-white/5 gibi opacity kullanımları
  /\btext-white\/\d+\b/,
  /\bborder-white\/\d+\b/,
];

const EXCLUDE_PATHS = [
  'node_modules',
  '.next',
  'dist',
  'build',
  'coverage',
  '.git',
  'scripts/check-ui-tokens.js',
  'tailwind.config',
  'globals.css',
  'page-old.tsx', // Eski dosyalar
];

const BASELINE_FILE = path.join(__dirname, 'ui-tokens.baseline.json');

function shouldExclude(filePath) {
  return EXCLUDE_PATHS.some(exclude => filePath.includes(exclude));
}

function isAllowed(line) {
  return ALLOWED_PATTERNS.some(pattern => pattern.test(line));
}

function extractMatchedClass(line, pattern) {
  // Pattern'den matched class'ı çıkar
  // Örnek: "bg-white text-black" -> "bg-white" veya "text-black"
  const patternStr = pattern.toString();

  // Pattern regex'ini parse et ve matched class'ı bul
  if (patternStr.includes('bg-white')) {
    const match = line.match(/\bbg-white(?:\/\d+)?\b/);
    return match ? match[0] : 'bg-white';
  }
  if (patternStr.includes('text-black')) {
    const match = line.match(/\btext-black\b/);
    return match ? match[0] : 'text-black';
  }
  if (patternStr.includes('border-gray')) {
    const match = line.match(/\bborder-gray-\d+\b/);
    return match ? match[0] : 'border-gray-*';
  }
  if (patternStr.includes('bg-gray')) {
    const match = line.match(/\bbg-gray-\d+\b/);
    return match ? match[0] : 'bg-gray-*';
  }
  if (patternStr.includes('text-gray')) {
    const match = line.match(/\btext-gray-\d+\b/);
    return match ? match[0] : 'text-gray-*';
  }
  if (patternStr.includes('dark:bg')) {
    const match = line.match(/\bdark:bg-\w+-\d+\b/);
    return match ? match[0] : 'dark:bg-*';
  }
  if (patternStr.includes('dark:text')) {
    const match = line.match(/\bdark:text-\w+-\d+\b/);
    return match ? match[0] : 'dark:text-*';
  }
  if (patternStr.includes('dark:border')) {
    const match = line.match(/\bdark:border-\w+-\d+\b/);
    return match ? match[0] : 'dark:border-*';
  }

  // Fallback: pattern string'i kullan
  return patternStr;
}

function hashViolation(violation) {
  // Stabil hash: file + matched_class + pattern (line number YOK)
  // Bu sayede satır kayması yeni ihlal olarak algılanmaz
  const matchedClass = extractMatchedClass(violation.content, violation.pattern);
  const str = `${violation.file}:${matchedClass}:${violation.pattern}`;
  return crypto.createHash('md5').update(str).digest('hex');
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const violations = [];

  lines.forEach((line, index) => {
    FORBIDDEN_PATTERNS.forEach(pattern => {
      if (pattern.test(line) && !isAllowed(line)) {
        violations.push({
          file: filePath,
          line: index + 1,
          content: line.trim(),
          pattern: pattern.toString(),
          hash: null, // Will be set later
        });
      }
    });
  });

  // Hash'leri ekle
  violations.forEach(v => {
    v.hash = hashViolation(v);
  });

  return violations;
}

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (shouldExclude(filePath)) {
      return;
    }

    if (stat.isDirectory()) {
      getAllFiles(filePath, fileList);
    } else if (filePath.match(/\.(tsx?|jsx?)$/)) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function loadBaseline() {
  if (!fs.existsSync(BASELINE_FILE)) {
    return null;
  }
  try {
    const content = fs.readFileSync(BASELINE_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error(`❌ Failed to load baseline: ${err.message}`);
    return null;
  }
}

function saveBaseline(violations) {
  const baseline = {
    version: '1.0.0',
    createdAt: new Date().toISOString(),
    violations: violations.map(v => ({
      file: v.file,
      line: v.line,
      pattern: v.pattern,
      hash: v.hash,
    })),
  };

  fs.writeFileSync(BASELINE_FILE, JSON.stringify(baseline, null, 2));
  console.log(`✅ Baseline saved to ${BASELINE_FILE} (${violations.length} violations)`);
}

function compareWithBaseline(allViolations, baseline) {
  if (!baseline) {
    return {
      newViolations: allViolations,
      baselineViolations: [],
      removedViolations: [],
    };
  }

  const baselineHashes = new Set(baseline.violations.map(v => v.hash));
  const currentHashes = new Set(allViolations.map(v => v.hash));

  const newViolations = allViolations.filter(v => !baselineHashes.has(v.hash));
  const baselineViolations = allViolations.filter(v => baselineHashes.has(v.hash));
  const removedViolations = baseline.violations.filter(v => !currentHashes.has(v.hash));

  return {
    newViolations,
    baselineViolations,
    removedViolations,
  };
}

function main() {
  const targetDir = process.argv[2] || 'apps/web-next/src';
  const mode = process.argv[3] || 'check'; // 'check' or 'update-baseline'

  const allFiles = getAllFiles(targetDir);
  const allViolations = [];

  console.log(`🔍 Scanning ${allFiles.length} files for hardcode UI classes...\n`);

  allFiles.forEach(file => {
    const violations = scanFile(file);
    if (violations.length > 0) {
      allViolations.push(...violations);
    }
  });

  if (mode === 'update-baseline') {
    saveBaseline(allViolations);
    console.log(`\n✅ Baseline updated with ${allViolations.length} violations.`);
    console.log(`💡 Run 'pnpm check:ui-tokens' to check for new violations.`);
    process.exit(0);
  }

  // Check mode
  const baseline = loadBaseline();

  if (!baseline) {
    console.error('❌ Baseline file not found!');
    console.error(`\n💡 Create baseline first:`);
    console.error(`   pnpm check:ui-tokens:baseline`);
    console.error(`\n   This will save current violations as baseline.`);
    console.error(`   After that, only NEW violations will fail the check.`);
    process.exit(1);
  }

  const comparison = compareWithBaseline(allViolations, baseline);

  if (comparison.newViolations.length === 0) {
    console.log('✅ No NEW hardcode UI classes found!');
    if (comparison.baselineViolations.length > 0) {
      console.log(`ℹ️  ${comparison.baselineViolations.length} baseline violations still exist (will be cleaned up gradually).`);
    }
    if (comparison.removedViolations.length > 0) {
      console.log(`✅ ${comparison.removedViolations.length} violations were fixed!`);
    }
    process.exit(0);
  }

  console.error(`❌ Found ${comparison.newViolations.length} NEW violation(s):\n`);

  // Grupla dosyaya göre
  const grouped = {};
  comparison.newViolations.forEach(v => {
    if (!grouped[v.file]) {
      grouped[v.file] = [];
    }
    grouped[v.file].push(v);
  });

  Object.entries(grouped).forEach(([file, violations]) => {
    console.error(`\n📄 ${file}:`);
    violations.forEach(v => {
      console.error(`  Line ${v.line}: ${v.content}`);
      console.error(`    Pattern: ${v.pattern}`);
    });
  });

  console.error(`\n❌ Token Lockdown Failed: ${comparison.newViolations.length} NEW violation(s) found.`);
  console.error(`ℹ️  ${comparison.baselineViolations.length} baseline violations exist (not blocking).`);
  console.error('\n💡 Fix: Replace hardcode classes with theme tokens:');
  console.error('   - bg-white → bg-card or bg-background');
  console.error('   - text-black → text-card-foreground or text-foreground');
  console.error('   - border-gray-* → border-border or border-neutral-*');
  console.error('   - dark:bg-* → Remove, use token instead');
  console.error('   - dark:text-* → Remove, use token instead');

  process.exit(1);
}

main();
