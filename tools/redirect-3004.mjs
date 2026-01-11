#!/usr/bin/env node

/**
 * Port Redirect - 3004 → 3003
 * Çapraz platform HTTP redirect proxy
 *
 * Kullanım:
 *   node tools/redirect-3004.mjs
 *
 * İptal: Ctrl+C veya SIGTERM
 */

import http from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const LISTEN_PORT = 3004;
const REDIRECT_PORT = 3003;
const REDIRECT_HOST = '127.0.0.1';
const LISTEN_HOST = '127.0.0.1';

const server = http.createServer((req, res) => {
  // Redirect header
  res.statusCode = 302; // Found - HTTP redirect
  res.setHeader('Location', `http://${REDIRECT_HOST}:${REDIRECT_PORT}${req.url}`);
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.end();
});

server.listen(LISTEN_PORT, LISTEN_HOST, () => {
  console.log(`✓ Redirect 3004 → 3003 aktif`);
  console.log(`  http://${LISTEN_HOST}:${LISTEN_PORT} → http://${REDIRECT_HOST}:${REDIRECT_PORT}`);
  console.log('\nİptal: Ctrl+C\n');
});

// Graceful shutdown
const signals = ['SIGTERM', 'SIGINT'];
signals.forEach((signal) => {
  process.on(signal, () => {
    console.log(`\n\n✓ Redirect kapatılıyor...`);
    server.close(() => {
      console.log(`✓ Kapatıldı`);
      process.exit(0);
    });
  });
});

// Port conflict guard
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n✗ Port ${LISTEN_PORT} zaten kullanımda`);
    console.error(`  → Başka bir süreç bu portu dinliyor`);
    console.error(`  → PowerShell: Get-NetTCPConnection -LocalPort ${LISTEN_PORT}`);
    process.exit(1);
  }
  throw err;
});

