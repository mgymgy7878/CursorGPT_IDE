#!/usr/bin/env node
/**
 * CSS Smoke Test - "Ciplak HTML" Regresyon Yakalayici (Node.js)
 * Bu script /dashboard HTML'inden CSS linkini cekip CSS gercekten CSS mi diye kontrol eder
 * CI/CD'de cross-platform calisir (Windows/Ubuntu)
 */

import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASE_URL = process.env.SMOKE_BASE_URL || 'http://127.0.0.1:3003';
const TIMEOUT_MS = 15000;

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

async function main() {
  log('CSS Smoke Test Baslatiyor...', 'cyan');
  log(`Base URL: ${BASE_URL}`, 'gray');
  console.log('');

  // 1. Dashboard HTML'ini al
  log('1. Dashboard HTML\'i aliniyor...', 'yellow');
  let htmlText;
  try {
    const htmlResponse = await fetchWithTimeout(`${BASE_URL}/dashboard`);
    if (htmlResponse.status !== 200) {
      log(`FAIL: Dashboard 200 donmedi: ${htmlResponse.status}`, 'red');
      process.exit(1);
    }
    htmlText = await htmlResponse.text();
    log(`OK: Dashboard HTML alindi (Status: ${htmlResponse.status})`, 'green');
  } catch (error) {
    log(`FAIL: Dashboard'a erisilemedi: ${error.message}`, 'red');
    process.exit(1);
  }

  // 2. CSS linklerini bul
  console.log('');
  log('2. CSS linkleri araniyor...', 'yellow');
  const cssLinkRegex = /href=["']([^"']*\.css[^"']*)["']/gi;
  const cssLinks = [];
  let match;
  while ((match = cssLinkRegex.exec(htmlText)) !== null) {
    cssLinks.push(match[1]);
  }

  if (cssLinks.length === 0) {
    log('WARN: CSS linki bulunamadi! (Ciplak HTML riski)', 'red');
    process.exit(1);
  }

  log(`OK: ${cssLinks.length} CSS linki bulundu`, 'green');

  // 3. Her CSS dosyasini kontrol et
  console.log('');
  log('3. CSS dosyalari kontrol ediliyor...', 'yellow');
  let allPassed = true;

  for (const cssLink of cssLinks) {
    // Relative URL'yi absolute'e cevir
    let cssUrl;
    if (cssLink.startsWith('/')) {
      cssUrl = `${BASE_URL}${cssLink}`;
    } else if (cssLink.startsWith('http')) {
      cssUrl = cssLink;
    } else {
      cssUrl = `${BASE_URL}/${cssLink}`;
    }

    log(`  Kontrol ediliyor: ${cssLink}`, 'gray');

    try {
      const cssResponse = await fetchWithTimeout(cssUrl);

      // Status kontrolu
      if (cssResponse.status !== 200) {
        log(`    FAIL: Status: ${cssResponse.status} (200 bekleniyordu)`, 'red');
        allPassed = false;
        continue;
      }

      // Content-Type kontrolu
      const contentType = cssResponse.headers.get('content-type') || '';
      if (!contentType.includes('text/css')) {
        log(`    FAIL: Content-Type: ${contentType} (text/css bekleniyordu)`, 'red');
        allPassed = false;
        continue;
      }

      // HTML iceriyor mu kontrolu (middleware redirect'i yakalamak icin)
      const cssText = await cssResponse.text();
      const contentStart = cssText.substring(0, Math.min(50, cssText.length)).toLowerCase();
      if (contentStart.includes('<!doctype') || contentStart.includes('<html') || contentStart.includes('<head')) {
        log('    FAIL: CSS dosyasi HTML iceriyor! (Middleware redirect riski)', 'red');
        const preview = cssText.substring(0, Math.min(100, cssText.length));
        log(`    Ilk 100 karakter: ${preview}`, 'red');
        allPassed = false;
        continue;
      }

      // CSS icerik kontrolu (basit)
      if (cssText.length < 10) {
        log(`    WARN: CSS dosyasi cok kisa (${cssText.length} byte)`, 'yellow');
      }

      log(`    OK: Status: ${cssResponse.status}, Content-Type: ${contentType}, Size: ${cssText.length} bytes`, 'green');

    } catch (error) {
      log(`    FAIL: CSS dosyasina erisilemedi: ${error.message}`, 'red');
      allPassed = false;
    }
  }

  // 4. Sonuc
  console.log('');
  if (allPassed) {
    log('OK: TUM CSS DOSYALARI DOGRU YUKLENIYOR', 'green');
    log("   'Ciplak HTML' riski yok", 'green');
    process.exit(0);
  } else {
    log('FAIL: BAZI CSS DOSYALARINDA SORUN VAR', 'red');
    log("   'Ciplak HTML' riski mevcut!", 'red');
    process.exit(1);
  }
}

main().catch((error) => {
  log(`FATAL: ${error.message}`, 'red');
  process.exit(1);
});

