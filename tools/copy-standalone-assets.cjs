#!/usr/bin/env node
/**
 * Copy standalone assets for Next.js production build
 * 
 * Next.js standalone mode doesn't copy static assets and public files by default.
 * This script copies them to the standalone directory for deployment.
 * 
 * Usage: node tools/copy-standalone-assets.cjs
 */

const fs = require('fs');
const path = require('path');

const WEB_NEXT_DIR = path.join(__dirname, '../apps/web-next');
const STANDALONE_DIR = path.join(WEB_NEXT_DIR, '.next/standalone');
const STATIC_DIR = path.join(WEB_NEXT_DIR, '.next/static');
const PUBLIC_DIR = path.join(WEB_NEXT_DIR, 'public');

/**
 * Recursively copy directory
 */
function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn(`⚠️  Source directory not found: ${src}`);
    return;
  }

  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log('📦 Copying standalone assets...\n');

// Skip in CI canary mode (no standalone build)
if (process.env.CI_CANARY === '1') {
  console.log('ℹ️  CI_CANARY mode detected, skipping standalone asset copy');
  process.exit(0);
}

// Check if standalone build exists
if (!fs.existsSync(STANDALONE_DIR)) {
  console.error('❌ Standalone build not found. Run `pnpm build` first.');
  process.exit(1);
}

// Copy .next/static → .next/standalone/apps/web-next/.next/static
const standaloneDotNextDir = path.join(STANDALONE_DIR, 'apps/web-next/.next');
const standaloneStaticDir = path.join(standaloneDotNextDir, 'static');

if (fs.existsSync(STATIC_DIR)) {
  console.log(`✅ Copying .next/static → ${standaloneStaticDir}`);
  copyDir(STATIC_DIR, standaloneStaticDir);
} else {
  console.warn('⚠️  .next/static not found, skipping...');
}

// Copy public → .next/standalone/apps/web-next/public
const standalonePublicDir = path.join(STANDALONE_DIR, 'apps/web-next/public');

if (fs.existsSync(PUBLIC_DIR)) {
  console.log(`✅ Copying public → ${standalonePublicDir}`);
  copyDir(PUBLIC_DIR, standalonePublicDir);
} else {
  console.warn('⚠️  public directory not found, skipping...');
}

console.log('\n✨ Standalone assets copied successfully!');
console.log('\n📝 To start standalone server:');
console.log('   cd apps/web-next/.next/standalone/apps/web-next');
console.log('   node server.js\n');

