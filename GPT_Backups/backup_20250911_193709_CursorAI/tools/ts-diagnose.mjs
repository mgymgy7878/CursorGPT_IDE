#!/usr/bin/env node

import { execSync } from 'child_process';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const args = process.argv.slice(2);
const outFile = args.find(arg => arg.startsWith('--out='))?.split('=')[1] || 'evidence/build/ts-report.json';
const topN = parseInt(args.find(arg => arg.startsWith('--top='))?.split('=')[1] || '10');

console.log('🔍 TypeScript hata analizi başlatılıyor...');

try {
  // TS hatalarını yakala
  let output = '';
  try {
    output = execSync('pnpm -w -r exec tsc --noEmit', { 
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 10 // 10MB
    });
  } catch (error) {
    // TS hataları stderr'de gelir, bu normal
    output = error.stdout || error.stderr || error.message;
  }
  
  // Hata sayısını çıkar
  const errorMatch = output.match(/Found (\d+) errors? in (\d+) files?/);
  const totalErrors = errorMatch ? parseInt(errorMatch[1]) : 0;
  const totalFiles = errorMatch ? parseInt(errorMatch[2]) : 0;
  
  // Hata kodlarını analiz et
  const errorCodes = {};
  const fileErrors = {};
  
  const lines = output.split('\n');
  for (const line of lines) {
    // TS hata satırlarını yakala: "file.ts:line:col - error TS1234: message"
    const errorMatch = line.match(/error (TS\d+):/);
    if (errorMatch) {
      const code = errorMatch[1];
      errorCodes[code] = (errorCodes[code] || 0) + 1;
    }
    
    // Dosya bazlı hata sayısı
    const fileMatch = line.match(/^(\d+)\s+([^\s]+\.tsx?):/);
    if (fileMatch) {
      const count = parseInt(fileMatch[1]);
      const file = fileMatch[2];
      fileErrors[file] = count;
    }
  }
  
  // En yaygın hata kodları
  const topErrorCodes = Object.entries(errorCodes)
    .sort(([,a], [,b]) => b - a)
    .slice(0, topN);
  
  // En çok hatası olan dosyalar
  const topFiles = Object.entries(fileErrors)
    .sort(([,a], [,b]) => b - a)
    .slice(0, topN);
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalErrors,
      totalFiles,
      topErrorCodes,
      topFiles
    },
    analysis: {
      mostCommonErrors: topErrorCodes.map(([code, count]) => ({
        code,
        count,
        percentage: ((count / totalErrors) * 100).toFixed(1) + '%'
      })),
      mostProblematicFiles: topFiles.map(([file, count]) => ({
        file,
        count,
        percentage: ((count / totalErrors) * 100).toFixed(1) + '%'
      }))
    },
    recommendations: generateRecommendations(topErrorCodes)
  };
  
  // Raporu kaydet
  mkdirSync(join(outFile, '..'), { recursive: true });
  writeFileSync(outFile, JSON.stringify(report, null, 2));
  
  console.log(`✅ Analiz tamamlandı: ${totalErrors} hata, ${totalFiles} dosya`);
  console.log(`📊 En yaygın hata kodları:`);
  topErrorCodes.forEach(([code, count]) => {
    console.log(`   ${code}: ${count} kez (${((count / totalErrors) * 100).toFixed(1)}%)`);
  });
  console.log(`📁 En çok hatası olan dosyalar:`);
  topFiles.slice(0, 5).forEach(([file, count]) => {
    console.log(`   ${file}: ${count} hata`);
  });
  console.log(`💾 Rapor kaydedildi: ${outFile}`);
  
} catch (error) {
  console.error('❌ Analiz hatası:', error.message);
  process.exit(1);
}

function generateRecommendations(topErrorCodes) {
  const recommendations = [];
  
  for (const [code, count] of topErrorCodes) {
    switch (code) {
      case 'TS2307':
        recommendations.push({
          code: 'TS2307',
          issue: 'Cannot find module',
          solution: 'Barrel exports (index.ts) eksik veya yanlış import path',
          priority: 'HIGH'
        });
        break;
      case 'TS2339':
        recommendations.push({
          code: 'TS2339',
          issue: 'Property does not exist',
          solution: 'Type definitions eksik veya yanlış interface',
          priority: 'HIGH'
        });
        break;
      case 'TS18046':
        recommendations.push({
          code: 'TS18046',
          issue: 'Type is unknown',
          solution: 'Type assertion veya proper typing gerekli',
          priority: 'MEDIUM'
        });
        break;
      case 'TS7016':
        recommendations.push({
          code: 'TS7016',
          issue: 'Could not find declaration file',
          solution: '@types/* paketleri eksik',
          priority: 'MEDIUM'
        });
        break;
      case 'TS6133':
        recommendations.push({
          code: 'TS6133',
          issue: 'Unused variable',
          solution: 'ESLint ile otomatik temizlik',
          priority: 'LOW'
        });
        break;
    }
  }
  
  return recommendations;
}
