#!/usr/bin/env node
/**
 * Windows-specific dev script
 * Bypasses sh/bash requirements
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('🪟 Starting dev server (Windows)...');

// Step 1: Clear .next cache
console.log('🧹 Clearing .next cache...');

const clearCache = spawn('powershell', [
  '-NoProfile',
  '-Command',
  `Remove-Item -Recurse -Force "${join(projectRoot, '.next')}" -ErrorAction SilentlyContinue; Write-Output "Cache cleared"`
], { cwd: projectRoot, stdio: 'pipe' });

let output = '';
clearCache.stdout.on('data', (data) => {
  output += data.toString();
});

clearCache.on('close', (code) => {
  if (output.includes('Cache cleared') || code === 0) {
    console.log('✅ Cache cleared');
  }
  startDevServer();
});

function startDevServer() {
  console.log('🔥 Starting Next.js dev server on port 3003...');

  const env = {
    ...process.env,
    WATCHPACK_POLLING: 'true',
    WATCHPACK_POLLING_INTERVAL: '2000',
    NEXT_WEBPACK_USEPERSISTENTCACHE: 'false',
    CHOKIDAR_USEPOLLING: '1',
  };

  // Use npx to run next directly
  const devServer = spawn('npx', ['next', 'dev', '-p', '3003', '-H', '0.0.0.0'], {
    cwd: projectRoot,
    stdio: 'inherit',
    env,
    shell: true
  });

  devServer.on('error', (err) => {
    console.error('❌ Failed to start dev server:', err);
    process.exit(1);
  });

  devServer.on('close', (code) => {
    console.log(`\nDev server exited with code ${code}`);
    process.exit(code || 0);
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n👋 Shutting down gracefully...');
    devServer.kill('SIGTERM');
  });

  process.on('SIGTERM', () => {
    devServer.kill('SIGTERM');
  });

  console.log('\n✅ Dev server is starting...');
  console.log('📍 URL: http://localhost:3003');
  console.log('🔍 Watch mode: polling (Windows-compatible)');
  console.log('\nPress Ctrl+C to stop\n');
}

