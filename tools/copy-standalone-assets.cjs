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
const ROOT_DIR = path.join(__dirname, '..');

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

// Fix: Copy styled-jsx (Next.js internal dependency not auto-included in standalone)
// https://github.com/vercel/next.js/issues/42641
// Resolve styled-jsx from web-next context (store-layout independent)
const standaloneNodeModules = path.join(STANDALONE_DIR, 'node_modules');
const standaloneStyledJsxDir = path.join(standaloneNodeModules, 'styled-jsx');

let styledJsxDir = null;

// Strategy 1: Try require.resolve with paths (works if web-next has node_modules)
try {
  const styledJsxPath = require.resolve('styled-jsx/package.json', {
    paths: [WEB_NEXT_DIR, ROOT_DIR],
  });
  styledJsxDir = path.dirname(styledJsxPath);
} catch (err) {
  // Strategy 2: Find in pnpm store (.pnpm/styled-jsx@*/node_modules/styled-jsx)
  // Fallback for pnpm workspace where modules are in .pnpm store
  const pnpmStoreDir = path.join(ROOT_DIR, 'node_modules/.pnpm');
  if (fs.existsSync(pnpmStoreDir)) {
    const entries = fs.readdirSync(pnpmStoreDir);
    for (const entry of entries) {
      if (entry.startsWith('styled-jsx@')) {
        const candidate = path.join(pnpmStoreDir, entry, 'node_modules/styled-jsx');
        if (fs.existsSync(candidate)) {
          styledJsxDir = candidate;
          break;
        }
      }
    }
  }
}

if (styledJsxDir && fs.existsSync(styledJsxDir)) {
  console.log(`✅ Copying styled-jsx → ${standaloneStyledJsxDir}`);
  copyDir(styledJsxDir, standaloneStyledJsxDir);
} else {
  console.warn('⚠️  styled-jsx not found, skipping...');
  console.warn('   This may cause server startup failures in CI.');
}

console.log('\n✨ Standalone assets copied successfully!');
console.log('\n📝 To start standalone server:');
console.log('   cd apps/web-next/.next/standalone/apps/web-next');
console.log('   node server.js\n');

