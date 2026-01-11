#!/usr/bin/env node
/**
 * Platform-agnostic dev script
 * Automatically detects Windows and uses appropriate commands
 */

import { spawn } from 'child_process';
import { platform } from 'os';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const isWindows = platform() === 'win32';

console.log(`🚀 Starting dev server (${isWindows ? 'Windows' : 'Unix'} mode)...`);

// Clear .next cache
console.log('🧹 Clearing .next cache...');

if (isWindows) {
  // Windows: Use PowerShell to remove directory
  const clearCache = spawn('powershell', [
    '-NoProfile',
    '-Command',
    `Remove-Item -Recurse -Force "${join(projectRoot, '.next')}" -ErrorAction SilentlyContinue`
  ], { cwd: projectRoot, stdio: 'inherit' });

  clearCache.on('close', (code) => {
    console.log('✅ Cache cleared');
    startDevServer();
  });
} else {
  // Unix: Use rm
  const clearCache = spawn('rm', ['-rf', '.next'], {
    cwd: projectRoot,
    stdio: 'inherit',
    shell: true
  });

  clearCache.on('close', (code) => {
    console.log('✅ Cache cleared');
    startDevServer();
  });
}

function startDevServer() {
  console.log('🔥 Starting Next.js dev server...');

  const env = {
    ...process.env,
    WATCHPACK_POLLING: 'true',
    WATCHPACK_POLLING_INTERVAL: '2000',
    NEXT_WEBPACK_USEPERSISTENTCACHE: 'true',
    CHOKIDAR_USEPOLLING: '1',
  };

  const devServer = spawn('npx', ['next', 'dev', '-p', '3003'], {
    cwd: projectRoot,
    stdio: 'inherit',
    env,
    shell: isWindows
  });

  devServer.on('error', (err) => {
    console.error('❌ Failed to start dev server:', err);
    process.exit(1);
  });

  devServer.on('close', (code) => {
    console.log(`Dev server exited with code ${code}`);
    process.exit(code || 0);
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n👋 Shutting down...');
    devServer.kill('SIGTERM');
  });

  process.on('SIGTERM', () => {
    devServer.kill('SIGTERM');
  });
}

