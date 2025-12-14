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

// Marker: Script execution start (CI verification)
console.log('[copy-standalone-assets] START', JSON.stringify({
  cwd: process.cwd(),
  __dirname: __dirname,
  timestamp: new Date().toISOString(),
}, null, 2));

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
  // Copy to root standalone node_modules (for .next/standalone/server.js)
  // Use fs.cpSync with dereference:true to resolve symlinks (pnpm store symlinks)
  // This ensures CI runtime can resolve styled-jsx even if symlink target is broken
  console.log(`✅ Copying styled-jsx → ${standaloneStyledJsxDir} (dereferencing symlinks)`);
  fs.cpSync(styledJsxDir, standaloneStyledJsxDir, { recursive: true, dereference: true });

  // Also copy to nested standalone node_modules (for .next/standalone/apps/web-next/server.js)
  const nestedStandaloneNodeModules = path.join(STANDALONE_DIR, 'apps/web-next/node_modules');
  const nestedStandaloneStyledJsxDir = path.join(nestedStandaloneNodeModules, 'styled-jsx');
  console.log(`✅ Copying styled-jsx → ${nestedStandaloneStyledJsxDir} (nested, dereferencing symlinks)`);
  fs.cpSync(styledJsxDir, nestedStandaloneStyledJsxDir, { recursive: true, dereference: true });

  // Fail-fast: Verify styled-jsx was actually copied in both locations
  const targetPkgJson = path.join(standaloneStyledJsxDir, 'package.json');
  const nestedTargetPkgJson = path.join(nestedStandaloneStyledJsxDir, 'package.json');

  if (!fs.existsSync(targetPkgJson)) {
    console.error(`❌ styled-jsx copy failed: ${targetPkgJson} not found after copy`);
    process.exit(1);
  }
  if (!fs.existsSync(nestedTargetPkgJson)) {
    console.error(`❌ styled-jsx nested copy failed: ${nestedTargetPkgJson} not found after copy`);
    process.exit(1);
  }

  console.log(`✅ Verified: styled-jsx/package.json exists in standalone (both locations)`);
  // Marker: styled-jsx copy verified (CI verification)
  console.log('[copy-standalone-assets] styled-jsx OK:', targetPkgJson);
  console.log('[copy-standalone-assets] styled-jsx OK (nested):', nestedTargetPkgJson);
} else {
  console.error('❌ styled-jsx not found - this will cause server startup failures in CI');
  console.error('   Aborting build to prevent CI failures.');
  process.exit(1);
}

// Fix: Copy core packages (next, react, react-dom) to standalone
// These are required for runtime but may be missing due to broken symlinks in pnpm store
const CORE_PACKAGES = ['next', 'react', 'react-dom', 'scheduler'];

/**
 * Copy a package to standalone node_modules (both root and nested)
 */
function copyPackageToStandalone(packageName) {
  let packageDir = null;

  // Strategy 1: Try require.resolve
  try {
    const packagePath = require.resolve(`${packageName}/package.json`, {
      paths: [WEB_NEXT_DIR, ROOT_DIR],
    });
    packageDir = path.dirname(packagePath);
  } catch (err) {
    // Strategy 2: Find in pnpm store
    const pnpmStoreDir = path.join(ROOT_DIR, 'node_modules/.pnpm');
    if (fs.existsSync(pnpmStoreDir)) {
      const entries = fs.readdirSync(pnpmStoreDir);
      for (const entry of entries) {
        if (entry.startsWith(`${packageName}@`)) {
          const candidate = path.join(pnpmStoreDir, entry, `node_modules/${packageName}`);
          if (fs.existsSync(candidate)) {
            packageDir = candidate;
            break;
          }
        }
      }
    }
  }

  if (!packageDir || !fs.existsSync(packageDir)) {
    // scheduler is optional, others are critical
    if (packageName === 'scheduler') {
      console.warn(`⚠️  ${packageName} not found (optional, skipping...)`);
      return false;
    }
    console.error(`❌ ${packageName} not found - this will cause server startup failures in CI`);
    return false;
  }

  // Copy to root standalone node_modules
  const standalonePackageDir = path.join(standaloneNodeModules, packageName);
  console.log(`✅ Copying ${packageName} → ${standalonePackageDir} (dereferencing symlinks)`);
  fs.cpSync(packageDir, standalonePackageDir, { recursive: true, dereference: true });

  // Also copy to nested standalone node_modules
  const nestedStandaloneNodeModules = path.join(STANDALONE_DIR, 'apps/web-next/node_modules');
  const nestedStandalonePackageDir = path.join(nestedStandaloneNodeModules, packageName);
  console.log(`✅ Copying ${packageName} → ${nestedStandalonePackageDir} (nested, dereferencing symlinks)`);
  fs.cpSync(packageDir, nestedStandalonePackageDir, { recursive: true, dereference: true });

  // Verify copy
  const targetPkgJson = path.join(standalonePackageDir, 'package.json');
  const nestedTargetPkgJson = path.join(nestedStandalonePackageDir, 'package.json');

  if (!fs.existsSync(targetPkgJson)) {
    console.error(`❌ ${packageName} copy failed: ${targetPkgJson} not found after copy`);
    return false;
  }
  if (!fs.existsSync(nestedTargetPkgJson)) {
    console.error(`❌ ${packageName} nested copy failed: ${nestedTargetPkgJson} not found after copy`);
    return false;
  }

  console.log(`✅ Verified: ${packageName}/package.json exists in standalone (both locations)`);
  console.log(`[copy-standalone-assets] ${packageName} OK:`, targetPkgJson);
  console.log(`[copy-standalone-assets] ${packageName} OK (nested):`, nestedTargetPkgJson);
  return true;
}

// Copy core packages
console.log('\n📦 Copying core packages to standalone...');
let allCorePackagesOk = true;
for (const pkg of CORE_PACKAGES) {
  const ok = copyPackageToStandalone(pkg);
  if (!ok && pkg !== 'scheduler') {
    allCorePackagesOk = false;
  }
}

if (!allCorePackagesOk) {
  console.error('❌ Core packages copy failed - aborting build to prevent CI failures.');
  process.exit(1);
}

console.log('\n✨ Standalone assets copied successfully!');
console.log('\n📝 To start standalone server:');
console.log('   cd apps/web-next/.next/standalone/apps/web-next');
console.log('   node server.js\n');

