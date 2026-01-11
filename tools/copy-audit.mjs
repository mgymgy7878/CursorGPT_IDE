#!/usr/bin/env node
/**
 * Copy Audit Script - PATCH V
 *
 * Yasaklı/dağınık UI string'leri tespit eder.
 * uiCopy.ts kullanılması gereken yerlerde hardcoded string'ler bulur.
 *
 * Kullanım: node tools/copy-audit.mjs
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const ROOT_DIR = process.cwd();
const SRC_DIR = join(ROOT_DIR, 'apps/web-next/src');

// Yasaklı string'ler (uiCopy.ts'den gelmeli)
const FORBIDDEN_STRINGS = [
  'Strateji Oluştur',
  'Uyarı Oluştur',
  'Tabloya Dön',
  'Listeye Dön',
  'Tam Ekran',
  'Çık',
  'Çıkış',
  'AL',
  'GÜÇLÜ AL',
  'BEKLE',
  'SAT',
  'Düşük',
  'Orta',
  'Yüksek',
  'Sistem',
  'Strateji',
  'Mod',
  'Normal',
  'Shadow',
  'Live',
];

// İzin verilen dosyalar (uiCopy.ts ve style guide hariç)
const ALLOWED_FILES = [
  'uiCopy.ts',
  'UI_COPY_STYLE_GUIDE.md',
];

// İgnore edilecek dizinler
const IGNORE_DIRS = [
  'node_modules',
  '.next',
  'dist',
  'build',
  '.git',
];

// İgnore edilecek dosya uzantıları
const IGNORE_EXTENSIONS = [
  '.json',
  '.md',
  '.log',
  '.lock',
];

/**
 * Dosya yolu ignore edilmeli mi?
 */
function shouldIgnore(filePath) {
  const parts = filePath.split(/[/\\]/);

  // Ignore dizinleri kontrol et
  for (const part of parts) {
    if (IGNORE_DIRS.includes(part)) {
      return true;
    }
  }

  // İzin verilen dosyalar
  const fileName = parts[parts.length - 1];
  if (ALLOWED_FILES.includes(fileName)) {
    return false; // İzin verilen dosyalar ignore edilmez
  }

  // Uzantı kontrolü
  const ext = extname(fileName);
  if (IGNORE_EXTENSIONS.includes(ext)) {
    return true;
  }

  return false;
}

/**
 * Dosyayı tara ve yasaklı string'leri bul
 */
function scanFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const violations = [];

    lines.forEach((line, index) => {
      FORBIDDEN_STRINGS.forEach((forbidden) => {
        // String literal içinde mi kontrol et (tırnak içinde)
        const regex = new RegExp(`['"\`]${forbidden.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"\`]`, 'g');
        if (regex.test(line)) {
          // uiCopy kullanımı var mı kontrol et (aynı satırda)
          if (!line.includes('uiCopy') && !line.includes('//') && !line.includes('*')) {
            violations.push({
              line: index + 1,
              content: line.trim(),
              forbidden,
            });
          }
        }
      });
    });

    return violations;
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return [];
  }
}

/**
 * Dizini recursive olarak tara
 */
function scanDirectory(dirPath) {
  const results = [];

  try {
    const entries = readdirSync(dirPath);

    for (const entry of entries) {
      const fullPath = join(dirPath, entry);

      if (shouldIgnore(fullPath)) {
        continue;
      }

      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        results.push(...scanDirectory(fullPath));
      } else if (stat.isFile() && (entry.endsWith('.ts') || entry.endsWith('.tsx'))) {
        const violations = scanFile(fullPath);
        if (violations.length > 0) {
          results.push({
            file: fullPath.replace(ROOT_DIR + '/', ''),
            violations,
          });
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning ${dirPath}:`, error.message);
  }

  return results;
}

/**
 * Ana fonksiyon
 */
function main() {
  console.log('🔍 Copy Audit Script - PATCH V\n');
  console.log('Yasaklı string\'ler taranıyor...\n');

  const results = scanDirectory(SRC_DIR);

  if (results.length === 0) {
    console.log('✅ Hiç yasaklı string bulunamadı! Tüm UI metinleri uiCopy.ts\'den geliyor.\n');
    process.exit(0);
  }

  console.log(`❌ ${results.length} dosyada yasaklı string bulundu:\n`);

  results.forEach((result) => {
    console.log(`📄 ${result.file}`);
    result.violations.forEach((violation) => {
      console.log(`   Satır ${violation.line}: "${violation.forbidden}"`);
      console.log(`   → ${violation.content.substring(0, 80)}${violation.content.length > 80 ? '...' : ''}`);
    });
    console.log('');
  });

  console.log(`\n💡 Öneri: Bu string'leri uiCopy.ts'den kullanın.`);
  console.log(`   Örnek: "${results[0]?.violations[0]?.forbidden}" → uiCopy.create.strategy\n`);

  process.exit(1);
}

main();

