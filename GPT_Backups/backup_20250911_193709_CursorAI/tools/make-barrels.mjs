#!/usr/bin/env node

import { readdirSync, writeFileSync, existsSync, statSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

console.log('🔧 Barrel export otomasyonu başlatılıyor...');

function findPackages() {
  const packagesDir = join(rootDir, 'packages');
  const packages = [];
  
  if (!existsSync(packagesDir)) {
    console.log('❌ packages dizini bulunamadı');
    return packages;
  }
  
  for (const item of readdirSync(packagesDir)) {
    const itemPath = join(packagesDir, item);
    if (statSync(itemPath).isDirectory()) {
      packages.push(itemPath);
    }
  }
  
  return packages;
}

function findSourceFiles(srcDir) {
  const files = [];
  
  if (!existsSync(srcDir)) {
    return files;
  }
  
  function scanDir(dir) {
    for (const item of readdirSync(dir)) {
      const itemPath = join(dir, item);
      const stat = statSync(itemPath);
      
      if (stat.isDirectory()) {
        // Test ve dts klasörlerini atla
        if (!['test', 'tests', '__tests__', 'dts', 'types'].includes(item)) {
          scanDir(itemPath);
        }
      } else if (item.endsWith('.ts') && !item.endsWith('.d.ts') && item !== 'index.ts') {
        files.push(itemPath);
      }
    }
  }
  
  scanDir(srcDir);
  return files;
}

function generateBarrelExports(packagePath) {
  const srcDir = join(packagePath, 'src');
  const indexPath = join(srcDir, 'index.ts');
  
  if (!existsSync(srcDir)) {
    console.log(`⏭️  ${packagePath} - src dizini yok`);
    return;
  }
  
  const sourceFiles = findSourceFiles(srcDir);
  
  if (sourceFiles.length === 0) {
    console.log(`⏭️  ${packagePath} - src dosyası yok`);
    return;
  }
  
  // Mevcut index.ts'yi oku
  let existingContent = '';
  if (existsSync(indexPath)) {
    existingContent = readFileSync(indexPath, 'utf8');
  }
  
  // Barrel export'ları oluştur
  const exports = [];
  const relativePaths = new Set();
  
  for (const file of sourceFiles) {
    const relativePath = file.replace(srcDir + '/', '').replace('.ts', '');
    relativePaths.add(relativePath);
  }
  
  // Sadece yeni export'ları ekle
  for (const path of relativePaths) {
    const exportLine = `export * from './${path}';`;
    if (!existingContent.includes(exportLine)) {
      exports.push(exportLine);
    }
  }
  
  if (exports.length > 0) {
    const newContent = existingContent + (existingContent ? '\n\n// Auto-generated barrel exports\n' : '') + exports.join('\n') + '\n';
    writeFileSync(indexPath, newContent);
    console.log(`✅ ${packagePath} - ${exports.length} export eklendi`);
  } else {
    console.log(`⏭️  ${packagePath} - yeni export yok`);
  }
}

function main() {
  const packages = findPackages();
  
  if (packages.length === 0) {
    console.log('❌ Hiç paket bulunamadı');
    return;
  }
  
  console.log(`📦 ${packages.length} paket bulundu`);
  
  for (const packagePath of packages) {
    const packageName = packagePath.split('/').pop();
    console.log(`\n🔍 ${packageName} işleniyor...`);
    generateBarrelExports(packagePath);
  }
  
  console.log('\n✅ Barrel export otomasyonu tamamlandı');
}

main();
